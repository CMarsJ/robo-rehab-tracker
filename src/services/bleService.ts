// Servicio Web Bluetooth para comunicación con ESP32_IMU_BLE

// UUIDs del dispositivo BLE
const BLE_SERVICE_UUID = '12345678-1234-1234-1234-123456789abc';
const BLE_CONTROL_CHAR_UUID = '12345678-1234-1234-1234-123456789ab2';
const BLE_DATA_CHAR_UUID = '12345678-1234-1234-1234-123456789ab1';
const BLE_EMERGENCY_CHAR_UUID = '12345678-1234-1234-1234-123456789ab3';
const BLE_DEVICE_NAME = 'ESP32_IMU_BLE';

// Datos recibidos del ESP32 vía BLE
export interface BLERawHandData {
  active: boolean;
  mcp_finger: number;
  mcp_thumb: number;
  effort: number;
}

export interface BLERawData {
  leftHand: BLERawHandData;
  rightHand: BLERawHandData;
  timestamp: string;
}

// Datos procesados con todos los ángulos calculados
export interface BLEHandData {
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

export interface BLEMessage {
  leftHand: BLEHandData;
  rightHand: BLEHandData;
  timestamp: string;
}

export type BLEStatus = 'connected' | 'disconnected' | 'error';

// Usar any para tipos Web Bluetooth ya que no están en las libs estándar de TS
export class BLEService {
  private device: any = null;
  private server: any = null;
  private dataCharacteristic: any = null;
  private controlCharacteristic: any = null;
  private emergencyCharacteristic: any = null;
  private lastDataTimestamp: number = 0;
  private dataTimeoutMs = 60000;
  private emergencyState: boolean = false;

  private onDataCallback?: (data: BLEMessage) => void;
  private onStatusCallback?: (status: BLEStatus, message?: string) => void;
  private onEmergencyCallback?: (isEmergency: boolean) => void;

  constructor() {
    console.log('🔵 BLE Service initialized');
  }

  // Verifica si Web Bluetooth está disponible
  static isSupported(): boolean {
    return 'bluetooth' in navigator;
  }

  // Calcula los ángulos derivados a partir de mcp_finger y mcp_thumb
  private calculateAngles(rawHand: BLERawHandData): BLEHandData {
    const mcp_finger = rawHand.mcp_finger || 0;
    const mcp_thumb = rawHand.mcp_thumb || 0;

    // Fórmulas: PIP = 0.8 * MCP, DIP = 0.66 * PIP
    const pip_finger = 0.8 * mcp_finger;
    const dip_finger = 0.66 * pip_finger;
    // Pulgar: IP = 1.25 * MCP
    const ip_thumb = 1.25 * mcp_thumb;

    return {
      active: Boolean(rawHand.active),
      angles: {
        thumb1: mcp_thumb,
        thumb2: ip_thumb,
        thumb3: 0,
        finger1: mcp_finger,
        finger2: pip_finger,
        finger3: dip_finger,
      },
      effort: Math.min(100, Math.max(0, (rawHand.effort || 0) * 100)),
    };
  }

  // Solicita conexión BLE al usuario
  async connect(): Promise<void> {
    if (!BLEService.isSupported()) {
      this.onStatusCallback?.('error', 'Web Bluetooth no está soportado en este navegador');
      throw new Error('Web Bluetooth no soportado');
    }

    try {
      console.log('🔄 Solicitando dispositivo BLE...');
      this.onStatusCallback?.('disconnected', 'Buscando dispositivo...');

      const nav = navigator as any;
      this.device = await nav.bluetooth.requestDevice({
        filters: [{ name: BLE_DEVICE_NAME }],
        optionalServices: [BLE_SERVICE_UUID],
      });

      console.log('📱 Dispositivo seleccionado:', this.device.name);

      // Manejar desconexión automática
      this.device.addEventListener('gattserverdisconnected', () => {
        console.log('🔌 Dispositivo BLE desconectado');
        this.handleDisconnection();
      });

      // Conectar al GATT Server
      console.log('🔄 Conectando al GATT Server...');
      this.server = await this.device.gatt.connect();
      console.log('✅ Conectado al GATT Server');

      // Obtener el servicio
      const service = await this.server.getPrimaryService(BLE_SERVICE_UUID);
      console.log('📡 Servicio BLE obtenido');

      // Obtener las características
      await this.setupCharacteristics(service);

      this.onStatusCallback?.('connected', `Conectado a ${this.device.name}`);
    } catch (error: any) {
      console.error('❌ Error de conexión BLE:', error);
      if (error.name === 'NotFoundError') {
        this.onStatusCallback?.('error', 'No se encontró el dispositivo');
      } else if (error.name === 'SecurityError') {
        this.onStatusCallback?.('error', 'Permiso de Bluetooth denegado');
      } else {
        this.onStatusCallback?.('error', `Error: ${error.message}`);
      }
      throw error;
    }
  }

  private async setupCharacteristics(service: any): Promise<void> {
    // 1. DATA (Notify) - recibir datos de sensores
    try {
      this.dataCharacteristic = await service.getCharacteristic(BLE_DATA_CHAR_UUID);
      await this.dataCharacteristic.startNotifications();
      this.dataCharacteristic.addEventListener('characteristicvaluechanged', (event: any) => {
        this.handleDataNotification(event);
      });
      console.log('📊 Suscrito a notificaciones de DATA');
    } catch (e) {
      console.error('❌ Error configurando DATA characteristic:', e);
    }

    // 2. CONTROL (Write) - enviar comandos
    try {
      this.controlCharacteristic = await service.getCharacteristic(BLE_CONTROL_CHAR_UUID);
      console.log('🎮 CONTROL characteristic lista');
    } catch (e) {
      console.error('❌ Error configurando CONTROL characteristic:', e);
    }

    // 3. EMERGENCY (Read + Notify) - estado de emergencia
    try {
      this.emergencyCharacteristic = await service.getCharacteristic(BLE_EMERGENCY_CHAR_UUID);
      await this.emergencyCharacteristic.startNotifications();
      this.emergencyCharacteristic.addEventListener('characteristicvaluechanged', (event: any) => {
        this.handleEmergencyNotification(event);
      });
      // Leer estado inicial
      const value = await this.emergencyCharacteristic.readValue();
      const emergencyText = new TextDecoder().decode(value);
      this.emergencyState = emergencyText === '1';
      this.onEmergencyCallback?.(this.emergencyState);
      console.log('🚨 Suscrito a notificaciones de EMERGENCY, estado inicial:', this.emergencyState);
    } catch (e) {
      console.error('❌ Error configurando EMERGENCY characteristic:', e);
    }
  }

  private handleDataNotification(event: any): void {
    const value = event.target?.value;
    if (!value) return;

    try {
      const text = new TextDecoder().decode(value);
      const rawData: BLERawData = JSON.parse(text);
      console.log('📥 BLE data recibida:', rawData);

      this.lastDataTimestamp = Date.now();

      // Procesar ambas manos desde el JSON del ESP32
      const processedLeft = this.calculateAngles(rawData.leftHand);
      const processedRight = this.calculateAngles(rawData.rightHand);

      const processedData: BLEMessage = {
        leftHand: processedLeft,
        rightHand: processedRight,
        timestamp: new Date().toISOString(),
      };

      console.log('📊 Data procesada:', processedData);
      this.onDataCallback?.(processedData);
    } catch (error) {
      console.error('❌ Error parseando datos BLE:', error);
    }
  }

  private handleEmergencyNotification(event: any): void {
    const value = event.target?.value;
    if (!value) return;

    const text = new TextDecoder().decode(value);
    this.emergencyState = text.trim() === '1';
    console.log('🚨 Estado de emergencia:', this.emergencyState ? 'ACTIVA' : 'Normal');
    this.onEmergencyCallback?.(this.emergencyState);
  }

  private handleDisconnection(): void {
    this.dataCharacteristic = null;
    this.controlCharacteristic = null;
    this.emergencyCharacteristic = null;
    this.server = null;
    this.lastDataTimestamp = 0;
    this.onStatusCallback?.('disconnected', 'Dispositivo desconectado');
  }

  // Enviar comando al ESP32
  private async sendCommand(command: string): Promise<void> {
    if (!this.controlCharacteristic) {
      console.warn('⚠️ CONTROL characteristic no disponible');
      return;
    }

    try {
      const encoder = new TextEncoder();
      await this.controlCharacteristic.writeValue(encoder.encode(command));
      console.log(`📤 Comando enviado: "${command}"`);
    } catch (error) {
      console.error(`❌ Error enviando comando "${command}":`, error);
    }
  }

  async startTherapy(): Promise<void> {
    await this.sendCommand('start');
    console.log('🚀 Start command sent to ESP32');
  }

  async stopTherapy(): Promise<void> {
    await this.sendCommand('stop');
    console.log('🛑 Stop command sent to ESP32');
  }

  async sendEmergency(): Promise<void> {
    await this.sendCommand('emergency');
    console.log('🚨 Emergency command sent to ESP32');
  }

  disconnect(): void {
    if (this.device?.gatt?.connected) {
      console.log('🔌 Desconectando BLE...');
      this.device.gatt.disconnect();
    }
    this.device = null;
    this.server = null;
    this.dataCharacteristic = null;
    this.controlCharacteristic = null;
    this.emergencyCharacteristic = null;
    this.lastDataTimestamp = 0;
    this.emergencyState = false;
    this.onStatusCallback?.('disconnected', 'Desconectado manualmente');
  }

  onData(callback: (data: BLEMessage) => void): void {
    this.onDataCallback = callback;
  }

  onStatus(callback: (status: BLEStatus, message?: string) => void): void {
    this.onStatusCallback = callback;
  }

  onEmergency(callback: (isEmergency: boolean) => void): void {
    this.onEmergencyCallback = callback;
  }

  isReceivingData(): boolean {
    if (this.lastDataTimestamp === 0) return false;
    return (Date.now() - this.lastDataTimestamp) < this.dataTimeoutMs;
  }

  isConnected(): boolean {
    return this.device?.gatt?.connected || false;
  }

  isEmergencyActive(): boolean {
    return this.emergencyState;
  }

  getDeviceName(): string | null {
    return this.device?.name || null;
  }
}

// Instancia singleton
export const bleService = new BLEService();
