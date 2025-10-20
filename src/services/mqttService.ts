import mqtt, { MqttClient } from 'mqtt';

export interface MQTTHandData {
  active: boolean;
  angles: {
    thumb1: number;
    thumb2: number;
    thumb3: number;
    finger1: number;
    finger2: number;
    finger3: number;
  };
  effort: number;
}

export interface MQTTMessage {
  leftHand: MQTTHandData;
  rightHand: MQTTHandData;
  timestamp: string;
}

export class MQTTService {
  private client: MqttClient | null = null;
  private brokerUrl = 'wss://184e3487ca504c6499ad247eabc97e38.s1.eu.hivemq.cloud:8884/mqtt';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private lastDataTimestamp: number = 0;
  private dataTimeoutMs = 60000; // 60 segundos sin datos = desconectado
  
  private onDataCallback?: (data: MQTTMessage) => void;
  private onStatusCallback?: (status: 'connected' | 'disconnected' | 'error', message?: string) => void;

  constructor() {
    console.log('🔌 MQTT Service initialized');
  }

  connect(username: string, password: string, topic: string = 'rehab/hand-data') {
    console.log('🔄 Connecting to HiveMQ Cloud...');
    
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
          this.client.subscribe(topic, (err) => {
            if (err) {
              console.error('❌ Error subscribing to topic:', err);
              this.onStatusCallback?.('error', `Error al suscribirse: ${err.message}`);
            } else {
              console.log(`📡 Subscribed to topic: ${topic}`);
            }
          });
        }
      });

      this.client.on('message', (receivedTopic, message) => {
        console.log(`📨 Message received on topic ${receivedTopic}`);
        
        try {
          const data = JSON.parse(message.toString()) as MQTTMessage;
          this.lastDataTimestamp = Date.now();
          
          console.log('📊 Data parsed:', data);
          this.onDataCallback?.(data);
        } catch (error) {
          console.error('❌ Error parsing MQTT message:', error);
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
