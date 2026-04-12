import mqtt, { MqttClient } from 'mqtt';

// Datos crudos del ESP32 (solo 2 ángulos por mano)
export interface MQTTRawHandData {
  active: boolean;
  mcp_finger: number; // MCP de los dedos
  mcp_thumb: number;  // MCP del pulgar
  effort: number;
}

// Datos procesados con todos los ángulos calculados
export interface MQTTHandData {
  active: boolean;
  angles: {
    thumb1: number; // MCP pulgar
    thumb2: number; // IP pulgar (calculado: 1.25 * MCP)
    thumb3: number; // Reservado
    finger1: number; // MCP dedos
    finger2: number; // PIP dedos (calculado: 2 * MCP)
    finger3: number; // DIP dedos (calculado: 0.66 * PIP)
  };
  effort: number;
}

export interface MQTTRawMessage {
  leftHand: MQTTRawHandData;
  rightHand: MQTTRawHandData;
  timestamp: string;
}

export interface MQTTMessage {
  leftHand: MQTTHandData;
  rightHand: MQTTHandData;
  timestamp: string;
}

export class MQTTService {
  private client: MqttClient | null = null;
  private brokerUrl = 'wss://7e8350d563654f49b9e95c47ac4bbb21.s1.eu.hivemq.cloud:8884/mqtt';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private lastDataTimestamp: number = 0;
  private dataTimeoutMs = 60000;
  
  private dataTopic = 'esp32/data';
  private controlTopic = 'esp32/control';
  
  private onDataCallback?: (data: MQTTMessage) => void;
  private onStatusCallback?: (status: 'connected' | 'disconnected' | 'error', message?: string) => void;

  constructor() {
    console.log('🔌 MQTT Service initialized');
  }

  // Calcula los ángulos derivados a partir de los MCP
  private calculateAngles(rawHand: MQTTRawHandData): MQTTHandData {
    const mcp_finger = rawHand.mcp_finger || 0;
    const mcp_thumb = rawHand.mcp_thumb || 0;
    
    // Fórmulas para dedos: PIP = 2 * MCP, DIP = 0.66 * PIP
    const pip_finger = 0.8 * mcp_finger;
    const dip_finger = 0.66 * pip_finger;
    
    // Fórmula para pulgar: IP = 1.25 * MCP
    const ip_thumb = 1.25 * mcp_thumb;

    return {
      active: rawHand.active,
      angles: {
        thumb1: mcp_thumb,
        thumb2: ip_thumb,
        thumb3: 0,
        finger1: mcp_finger,
        finger2: pip_finger,
        finger3: dip_finger,
      },
      effort: rawHand.effort || 0,
    };
  }

  connect(username: string, password: string, topic: string = 'esp32/data') {
    console.log('🔄 Connecting to HiveMQ Cloud...');
    
    // Actualizar topic de datos si se proporciona uno diferente
    this.dataTopic = topic;
    
    try {
      this.client = mqtt.connect(this.brokerUrl, {
        username,
        password,
        protocol: 'wss',
        port: 8884,
        reconnectPeriod: 5000,
        connectTimeout: 30000,
        clean: true,
        clientId: `rehab_client_${Math.random().toString(16).slice(2, 10)}`,
      });

      this.client.on('connect', () => {
        console.log('✅ Connected to HiveMQ Cloud');
        this.reconnectAttempts = 0;
        this.onStatusCallback?.('connected', 'Conectado a datos reales');
        
        if (this.client) {
          // Suscribirse al topic de datos
          this.client.subscribe(this.dataTopic, (err) => {
            if (err) {
              console.error('❌ Error subscribing to data topic:', err);
              this.onStatusCallback?.('error', `Error al suscribirse: ${err.message}`);
            } else {
              console.log(`📡 Subscribed to data topic: ${this.dataTopic}`);
            }
          });
        }
      });

      this.client.on('message', (receivedTopic, message) => {
        console.log(`📨 Message received on topic ${receivedTopic}`);
        
        if (receivedTopic === this.dataTopic) {
          try {
            const rawData = JSON.parse(message.toString());
            console.log('📥 Raw MQTT data:', rawData);
            
            // Validar estructura del mensaje
            if (!rawData || typeof rawData !== 'object') {
              console.warn('⚠️ Mensaje MQTT inválido: no es un objeto');
              return;
            }
            
            if (!rawData.leftHand || !rawData.rightHand) {
              console.warn('⚠️ Mensaje MQTT incompleto: falta leftHand o rightHand', rawData);
              return;
            }
            
            this.lastDataTimestamp = Date.now();
            
            // Procesar y calcular ángulos derivados
            const processedData: MQTTMessage = {
              leftHand: this.calculateAngles(rawData.leftHand),
              rightHand: this.calculateAngles(rawData.rightHand),
              timestamp: rawData.timestamp || new Date().toISOString(),
            };
            
            console.log('📊 Data processed:', processedData);
            this.onDataCallback?.(processedData);
          } catch (error) {
            console.error('❌ Error parsing MQTT message:', error);
            console.error('📄 Raw message:', message.toString());
          }
        }
      });

      this.client.on('error', (error) => {
        console.error('❌ MQTT Connection error:', error);
        this.onStatusCallback?.('error', `Error de conexión: ${error.message}`);
      });

      this.client.on('offline', () => {
        console.log('⚠️ MQTT Client offline');
        this.onStatusCallback?.('disconnected', 'Cliente MQTT desconectado');
      });

      this.client.on('reconnect', () => {
        this.reconnectAttempts++;
        console.log(`🔄 Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.log('❌ Max reconnection attempts reached');
          this.disconnect();
          this.onStatusCallback?.('error', 'No se pudo conectar después de varios intentos');
        }
      });

      this.client.on('close', () => {
        console.log('🔌 Connection closed');
        this.onStatusCallback?.('disconnected', 'Conexión cerrada');
      });

    } catch (error) {
      console.error('❌ Error creating MQTT client:', error);
      this.onStatusCallback?.('error', 'Error al crear cliente MQTT');
    }
  }

  // Enviar comando de inicio de terapia
  startTherapy() {
    if (this.client?.connected) {
      this.client.publish(this.controlTopic, 'start', (err) => {
        if (err) {
          console.error('❌ Error sending start command:', err);
        } else {
          console.log('🚀 Start command sent to ESP32');
        }
      });
    } else {
      console.warn('⚠️ Cannot send start: MQTT not connected');
    }
  }

  // Enviar comando de parada de terapia
  stopTherapy() {
    if (this.client?.connected) {
      this.client.publish(this.controlTopic, 'stop', (err) => {
        if (err) {
          console.error('❌ Error sending stop command:', err);
        } else {
          console.log('🛑 Stop command sent to ESP32');
        }
      });
    } else {
      console.warn('⚠️ Cannot send stop: MQTT not connected');
    }
  }

  disconnect() {
    if (this.client) {
      console.log('🔌 Disconnecting from MQTT broker...');
      this.client.end(true);
      this.client = null;
      this.lastDataTimestamp = 0;
      this.onStatusCallback?.('disconnected', 'Desconectado manualmente');
    }
  }

  onData(callback: (data: MQTTMessage) => void) {
    this.onDataCallback = callback;
  }

  onStatus(callback: (status: 'connected' | 'disconnected' | 'error', message?: string) => void) {
    this.onStatusCallback = callback;
  }

  isReceivingData(): boolean {
    if (this.lastDataTimestamp === 0) return false;
    return (Date.now() - this.lastDataTimestamp) < this.dataTimeoutMs;
  }

  isConnected(): boolean {
    return this.client?.connected || false;
  }
}

// Instancia singleton
export const mqttService = new MQTTService();
