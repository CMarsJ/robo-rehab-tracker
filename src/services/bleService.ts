// Servicio Web Bluetooth para comunicación con ESP32_IMU_BLE

// UUIDs del dispositivo BLE
const BLE_SERVICE_UUID = '12345678-1234-1234-1234-123456789abc';
const BLE_CONTROL_CHAR_UUID = '12345678-1234-1234-1234-123456789ab2';
const BLE_DATA_CHAR_UUID = '12345678-1234-1234-1234-123456789ab1';
const BLE_EMERGENCY_CHAR_UUID = '12345678-1234-1234-1234-123456789ab3';
const BLE_DEVICE_NAME = 'ESP32_IMU_BLE';

// Connection & pipeline constants
const BLE_INTERVAL_MS = 21;
const GAP_THRESHOLD_MS = BLE_INTERVAL_MS * 2; // 42 ms = 2 missed intervals
const DRAIN_INTERVAL_MS = 20;
const CLOCK_WINDOW_SIZE = 20;
const RECONNECT_BASE_MS = 200;
const RECONNECT_MAX_ATTEMPTS = 5;

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
  deviceTime?: number; // uint32 millis desde boot del ESP
  timestamp?: string | number; // Legacy: timestamp del ESP
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
  correctedTime?: number; // Jitter-corrected wall-clock time
  correctedTimePerfMs?: number;
  correctedTimeEpochMs?: number;
  deviceRawTimestamp?: string | number;
}

export type BLEStatus = 'connected' | 'disconnected' | 'error';

// Queued packet from Stage A (intake)
interface QueuedPacket {
  webTime: number; // performance.now()
  rawValue: ArrayBuffer;
  sequence: number;
}

interface ParsedPacket extends QueuedPacket {
  deviceTime: number;
  rawData: BLERawData;
}

// Packet loss event detail
export interface PacketLossDetail {
  skippedCycles: number;
  expectedTime: number;
  actualTime: number;
}

// --- Pure angle calculation functions ---

/** Clamp MCP input to valid range 0°–90° */
export const clampMCP = (value: number): number =>
  Math.min(90, Math.max(0, value));

/** θPIP = min(100°, 1.2 × θMCP) */
export const calculatePIP = (mcpDeg: number): number =>
  Math.min(100, 1.2 * clampMCP(mcpDeg));

/** θDIP = (2/3) × θPIP */
export const calculateDIP = (mcpDeg: number): number =>
  (2 / 3) * calculatePIP(mcpDeg);

/** Thumb IP = 1.25 × θMCP_thumb */
export const calculateThumbIP = (mcpThumbDeg: number): number =>
  1.25 * clampMCP(mcpThumbDeg);

/** Normalize MCP (0–90) to 0.0–1.0 range for therapy mode logic */
export const normalizeMCP = (mcpDeg: number): number =>
  clampMCP(mcpDeg) / 90;

// --- Clock sync layer ---

class ClockSync {
  private window: { deviceTime: number; webTime: number }[] = [];
  private currentOffset = 0;

  addSample(deviceTime: number, webTime: number): void {
    this.window.push({ deviceTime, webTime });
    if (this.window.length > CLOCK_WINDOW_SIZE) {
      this.window.shift();
    }
    // Recompute mean offset
    let sum = 0;
    for (const s of this.window) {
      sum += s.webTime - s.deviceTime;
    }
    this.currentOffset = sum / this.window.length;
  }

  getCorrectedTime(deviceTime: number): number {
    return deviceTime + this.currentOffset;
  }

  reset(): void {
    this.window = [];
    this.currentOffset = 0;
  }
}

export class BLEService {
  private device: any = null;
  private server: any = null;
  private dataCharacteristic: any = null;
  private controlCharacteristic: any = null;
  private emergencyCharacteristic: any = null;
  private lastDataTimestamp: number = 0;
  private dataTimeoutMs = 60000;
  private emergencyState: boolean = false;

  // --- Pipeline state ---
  private packetQueue: QueuedPacket[] = [];
  private drainIntervalId: ReturnType<typeof setInterval> | null = null;
  private lastDeviceTime: number = 0;
  private lastWebTime: number = 0;
  private nextPacketSequence = 0;
  private clockSync = new ClockSync();
  private readonly textDecoder = new TextDecoder();

  // --- Reconnection state ---
  private isReconnecting = false;
  private manualDisconnect = false;

  private onDataCallback?: (data: BLEMessage) => void;
  private onStatusCallback?: (status: BLEStatus, message?: string) => void;
  private onEmergencyCallback?: (isEmergency: boolean) => void;
  private onPacketLossCallback?: (detail: PacketLossDetail) => void;
  private readonly handleGattServerDisconnected = () => {
    console.log('🔌 Dispositivo BLE desconectado');
    this.handleDisconnection();
    if (!this.manualDisconnect && this.device) {
      void this.attemptReconnection();
    }
  };
  private readonly handleDataCharacteristicChanged = (event: Event) => {
    this.handleDataIntake(event);
  };
  private readonly handleEmergencyCharacteristicChanged = (event: Event) => {
    this.handleEmergencyNotification(event);
  };

  constructor() {
    console.log('🔵 BLE Service initialized (queued pipeline v2)');
  }

  // Verifica si Web Bluetooth está disponible
  static isSupported(): boolean {
    return 'bluetooth' in navigator;
  }

  // Calcula los ángulos derivados a partir de mcp_finger y mcp_thumb
  private calculateAngles(rawHand: BLERawHandData): BLEHandData {
    const mcp_finger = clampMCP(rawHand.mcp_finger || 0);
    const mcp_thumb = clampMCP(rawHand.mcp_thumb || 0);

    return {
      active: Boolean(rawHand.active),
      angles: {
        thumb1: mcp_thumb,
        thumb2: calculateThumbIP(mcp_thumb),
        thumb3: 0,
        finger1: mcp_finger,
        finger2: calculatePIP(mcp_finger),
        finger3: calculateDIP(mcp_finger),
      },
      effort: Math.min(100, Math.max(0, (rawHand.effort || 0) * 100)),
    };
  }

  /** Get jitter-corrected wall-clock time for a device timestamp */
  getCorrectedTime(deviceTime: number): number {
    return this.clockSync.getCorrectedTime(deviceTime);
  }

  private resetPipelineState(): void {
    this.packetQueue = [];
    this.lastDeviceTime = 0;
    this.lastWebTime = 0;
    this.nextPacketSequence = 0;
    this.clockSync.reset();
  }

  private cleanupCharacteristicSubscriptions(): void {
    if (this.dataCharacteristic) {
      this.dataCharacteristic.removeEventListener('characteristicvaluechanged', this.handleDataCharacteristicChanged);
      if (typeof this.dataCharacteristic.stopNotifications === 'function') {
        void this.dataCharacteristic.stopNotifications().catch(() => undefined);
      }
    }

    if (this.emergencyCharacteristic) {
      this.emergencyCharacteristic.removeEventListener('characteristicvaluechanged', this.handleEmergencyCharacteristicChanged);
      if (typeof this.emergencyCharacteristic.stopNotifications === 'function') {
        void this.emergencyCharacteristic.stopNotifications().catch(() => undefined);
      }
    }
  }

  private parseRawData(rawValue: ArrayBuffer): BLERawData | null {
    const bytes = new Uint8Array(rawValue);
    const payloadAttempts: Uint8Array[] = [bytes];

    if (bytes.byteLength > 4) {
      payloadAttempts.push(bytes.subarray(4));
    }

    for (const payload of payloadAttempts) {
      const text = this.textDecoder.decode(payload).replace(/\0+$/g, '').trim();
      if (!text) continue;

      try {
        const parsed = JSON.parse(text) as BLERawData;
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      } catch {
        // Intentar siguiente variante del payload sin bloquear el intake
      }
    }

    return null;
  }

  private extractBinaryDeviceTime(rawValue: ArrayBuffer): number {
    const bytes = new Uint8Array(rawValue);
    if (bytes.byteLength < 4) return 0;

    let firstSignificantByte = -1;
    for (const byte of bytes) {
      if (byte === 0 || byte === 9 || byte === 10 || byte === 13 || byte === 32) continue;
      firstSignificantByte = byte;
      break;
    }

    const looksLikeJson = firstSignificantByte === 123 || firstSignificantByte === 91 || firstSignificantByte === 34;
    if (looksLikeJson || firstSignificantByte === -1) {
      return 0;
    }

    return new DataView(rawValue).getUint32(0, true);
  }

  private parseQueuedPacket(packet: QueuedPacket): ParsedPacket | null {
    const rawData = this.parseRawData(packet.rawValue);
    if (!rawData) {
      console.warn('⚠️ Paquete BLE descartado: payload no válido');
      return null;
    }

    let deviceTime = 0;
    if (typeof rawData.deviceTime === 'number' && Number.isFinite(rawData.deviceTime)) {
      deviceTime = rawData.deviceTime;
    } else if (typeof rawData.timestamp === 'number' && Number.isFinite(rawData.timestamp)) {
      deviceTime = rawData.timestamp;
    } else {
      deviceTime = this.extractBinaryDeviceTime(packet.rawValue);
    }

    return {
      ...packet,
      deviceTime,
      rawData,
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
      this.manualDisconnect = false;
      this.onStatusCallback?.('disconnected', 'Buscando dispositivo...');

      const nav = navigator as any;
      this.device = await nav.bluetooth.requestDevice({
        filters: [{ name: BLE_DEVICE_NAME }],
        optionalServices: [BLE_SERVICE_UUID],
      });

      console.log('📱 Dispositivo seleccionado:', this.device.name);

      // Manejar desconexión automática con reconexión
      this.device.removeEventListener('gattserverdisconnected', this.handleGattServerDisconnected);
      this.device.addEventListener('gattserverdisconnected', this.handleGattServerDisconnected);

      // Conectar al GATT Server
      await this.connectGatt();
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

  /** Connect to GATT, request high priority, setup chars & pipeline */
  private async connectGatt(): Promise<void> {
    console.log('🔄 Conectando al GATT Server...');
    this.server = this.device?.gatt?.connected
      ? this.device.gatt
      : await this.device.gatt.connect();
    console.log('✅ Conectado al GATT Server');

    // Request high connection priority if supported
    try {
      if (this.server.requestConnectionPriority) {
        await this.server.requestConnectionPriority('high');
        console.log('⚡ Connection priority set to HIGH');
      } else {
        console.log('ℹ️ requestConnectionPriority not supported by this browser');
      }
    } catch (e) {
      console.warn('⚠️ Could not set connection priority:', e);
    }

    // Obtener el servicio
    const service = await this.server.getPrimaryService(BLE_SERVICE_UUID);
    console.log('📡 Servicio BLE obtenido');

    // Reset pipeline state on (re)connect
    this.cleanupCharacteristicSubscriptions();
    this.resetPipelineState();

    // Obtener las características
    await this.setupCharacteristics(service);

    // Start drain loop
    this.startDrainLoop();

    this.onStatusCallback?.('connected', `Conectado a ${this.device.name}`);
  }

  /** Exponential backoff reconnection loop */
  private async attemptReconnection(): Promise<void> {
    if (this.isReconnecting) return;
    this.isReconnecting = true;

    for (let attempt = 1; attempt <= RECONNECT_MAX_ATTEMPTS; attempt++) {
      if (this.manualDisconnect || !this.device) {
        this.isReconnecting = false;
        return;
      }

      const delay = RECONNECT_BASE_MS * Math.pow(2, attempt - 1);
      console.log(`🔄 Reconnection attempt ${attempt}/${RECONNECT_MAX_ATTEMPTS} in ${delay}ms — ${new Date().toISOString()}`);
      this.onStatusCallback?.('disconnected', `Reconectando... intento ${attempt}/${RECONNECT_MAX_ATTEMPTS}`);

      await new Promise(r => setTimeout(r, delay));

      if (this.manualDisconnect || !this.device) {
        this.isReconnecting = false;
        return;
      }

      try {
        await this.connectGatt();
        console.log(`✅ BLE reconnected — ${new Date().toISOString()}`);
        this.isReconnecting = false;
        return;
      } catch (e) {
        console.warn(`❌ Reconnection attempt ${attempt} failed:`, e);
      }
    }

    this.isReconnecting = false;
    console.error('❌ All reconnection attempts exhausted');
    this.onStatusCallback?.('error', 'No se pudo reconectar después de 5 intentos');
  }

  private async setupCharacteristics(service: any): Promise<void> {
    // 1. DATA (Notify) — Stage A: just enqueue, no processing
    try {
      this.dataCharacteristic = await service.getCharacteristic(BLE_DATA_CHAR_UUID);
      await this.dataCharacteristic.startNotifications();
      this.dataCharacteristic.addEventListener('characteristicvaluechanged', this.handleDataCharacteristicChanged);
      console.log('📊 Suscrito a notificaciones de DATA (queued pipeline)');
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

    // 3. EMERGENCY (Read + Notify)
    try {
      this.emergencyCharacteristic = await service.getCharacteristic(BLE_EMERGENCY_CHAR_UUID);
      await this.emergencyCharacteristic.startNotifications();
      this.emergencyCharacteristic.addEventListener('characteristicvaluechanged', this.handleEmergencyCharacteristicChanged);
      const value = await this.emergencyCharacteristic.readValue();
      const emergencyText = new TextDecoder().decode(value);
      this.emergencyState = emergencyText === '1';
      this.onEmergencyCallback?.(this.emergencyState);
      console.log('🚨 Suscrito a notificaciones de EMERGENCY, estado inicial:', this.emergencyState);
    } catch (e) {
      console.error('❌ Error configurando EMERGENCY characteristic:', e);
    }
  }

  // ========== Stage A: Intake — enqueue only ==========
  private handleDataIntake(event: any): void {
    const value = event.target?.value;
    if (!value) return;

    const rawValue = value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength);
    this.packetQueue.push({
      webTime: performance.now(),
      rawValue,
      sequence: this.nextPacketSequence++,
    });
  }

  // ========== Stage B: Drain loop — sort, detect gaps, process ==========
  private startDrainLoop(): void {
    this.stopDrainLoop();
    this.drainIntervalId = setInterval(() => this.drainQueue(), DRAIN_INTERVAL_MS);
    console.log('⏱️ Drain loop started (20ms interval)');
  }

  private stopDrainLoop(): void {
    if (this.drainIntervalId !== null) {
      clearInterval(this.drainIntervalId);
      this.drainIntervalId = null;
      console.log('⏱️ Drain loop stopped');
    }
  }

  private drainQueue(): void {
    if (this.packetQueue.length === 0) return;

    // Take all queued packets and clear the queue
    const batch = this.packetQueue
      .splice(0)
      .map((packet) => this.parseQueuedPacket(packet))
      .filter((packet): packet is ParsedPacket => packet !== null);

    if (batch.length === 0) return;

    // Sort by deviceTime ascending for ordering guarantee
    batch.sort((a, b) => {
      if (a.deviceTime > 0 && b.deviceTime > 0) {
        return a.deviceTime - b.deviceTime || a.sequence - b.sequence;
      }

      if (a.deviceTime > 0) return -1;
      if (b.deviceTime > 0) return 1;

      return a.sequence - b.sequence;
    });

    for (const packet of batch) {
      // Feed clock sync
      if (packet.deviceTime > 0) {
        this.clockSync.addSample(packet.deviceTime, packet.webTime);
      }

      // Gap detection
      if (this.lastDeviceTime > 0 && packet.deviceTime > 0) {
        const gap = packet.deviceTime - this.lastDeviceTime;
        if (gap > GAP_THRESHOLD_MS) {
          const skippedCycles = Math.round(gap / BLE_INTERVAL_MS) - 1;
          const detail: PacketLossDetail = {
            skippedCycles,
            expectedTime: this.lastDeviceTime + BLE_INTERVAL_MS,
            actualTime: packet.deviceTime,
          };
          console.warn(`⚠️ Packet loss: ${skippedCycles} cycles skipped (gap ${gap}ms)`);
          this.onPacketLossCallback?.(detail);

          // Dispatch custom event for external listeners
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('ble:packet-loss', { detail }));
          }
        }
      }

      if (packet.deviceTime > 0) {
        this.lastDeviceTime = packet.deviceTime;
      }
      this.lastWebTime = packet.webTime;
      this.lastDataTimestamp = Date.now();

      // Process the packet
      this.processPacket(packet);
    }
  }

  private processPacket(packet: ParsedPacket): void {
    const { rawData } = packet;

    const processedLeft = this.calculateAngles(rawData.leftHand);
    const processedRight = this.calculateAngles(rawData.rightHand);

    const correctedTimePerfMs = packet.deviceTime > 0
      ? this.clockSync.getCorrectedTime(packet.deviceTime)
      : undefined;
    const correctedTimeEpochMs = typeof correctedTimePerfMs === 'number'
      ? performance.timeOrigin + correctedTimePerfMs
      : undefined;

    const processedData: BLEMessage = {
      leftHand: processedLeft,
      rightHand: processedRight,
      timestamp: new Date(correctedTimeEpochMs ?? Date.now()).toISOString(),
      correctedTime: correctedTimePerfMs,
      correctedTimePerfMs,
      correctedTimeEpochMs,
      deviceRawTimestamp: packet.deviceTime || rawData.deviceTime ?? rawData.timestamp ?? undefined,
    };

    this.onDataCallback?.(processedData);
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
    this.stopDrainLoop();
    this.cleanupCharacteristicSubscriptions();
    this.resetPipelineState();
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
    const newState = !this.emergencyState;
    try {
      await this.sendCommand(newState ? 'emergency_on' : 'emergency_off');
      this.emergencyState = newState;
      this.onEmergencyCallback?.(this.emergencyState);
      console.log('🚨 Emergency toggled:', this.emergencyState ? 'ACTIVE' : 'CLEARED');
    } catch (error) {
      console.error('❌ Error toggling emergency:', error);
      this.emergencyState = newState;
      this.onEmergencyCallback?.(this.emergencyState);
    }
  }

  setEmergencyState(active: boolean): void {
    this.emergencyState = active;
    this.onEmergencyCallback?.(active);
  }

  disconnect(): void {
    this.manualDisconnect = true;
    this.stopDrainLoop();
    this.cleanupCharacteristicSubscriptions();
    if (this.device?.gatt?.connected) {
      console.log('🔌 Desconectando BLE...');
      this.device.gatt.disconnect();
    }
    this.device?.removeEventListener?.('gattserverdisconnected', this.handleGattServerDisconnected);
    this.device = null;
    this.server = null;
    this.dataCharacteristic = null;
    this.controlCharacteristic = null;
    this.emergencyCharacteristic = null;
    this.lastDataTimestamp = 0;
    this.resetPipelineState();
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

  onPacketLoss(callback: (detail: PacketLossDetail) => void): void {
    this.onPacketLossCallback = callback;
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
