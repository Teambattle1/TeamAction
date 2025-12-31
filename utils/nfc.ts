/**
 * NFC (Near Field Communication) Module
 * Provides read/write support for NFC tags
 * Works with Web NFC API (available on Android and Chrome)
 */

export interface NFCMessage {
    records: Array<{
        recordType: string;
        mediaType?: string;
        data?: ArrayBuffer;
        text?: string;
    }>;
}

export interface NFCTag {
    id: string;
    serialNumber: string;
    taskId?: string;
    timestamp: number;
    lastRead?: number;
    readCount?: number;
}

/**
 * Check if device supports NFC
 */
export const isNFCSupported = (): boolean => {
    return typeof window !== 'undefined' && 'NDEFReader' in window;
};

/**
 * Start NFC reading session
 * Listens for NFC tag interactions and returns the data
 */
export const startNFCReading = async (): Promise<NFCMessage | null> => {
    try {
        if (!isNFCSupported()) {
            throw new Error('NFC is not supported on this device');
        }

        const ndef = new (window as any).NDEFReader();
        
        return new Promise((resolve, reject) => {
            ndef.scan().then(() => {
                console.log('✓ NFC scan started. Bring your tag closer.');
                
                ndef.onreading = (event: any) => {
                    const message: NFCMessage = {
                        records: event.message.records.map((record: any) => ({
                            recordType: record.recordType,
                            mediaType: record.mediaType,
                            data: record.data,
                            text: new TextDecoder().decode(record.data)
                        }))
                    };
                    resolve(message);
                };

                ndef.onerror = () => {
                    reject(new Error('NFC reading error'));
                };
            }).catch((error: any) => {
                reject(error);
            });
        });
    } catch (error) {
        console.error('NFC Reading Error:', error);
        throw error;
    }
};

/**
 * Write data to NFC tag
 */
export const writeToNFC = async (data: string): Promise<boolean> => {
    try {
        if (!isNFCSupported()) {
            throw new Error('NFC is not supported on this device');
        }

        const ndef = new (window as any).NDEFReader();
        const encoder = new TextEncoder();

        await ndef.write({
            records: [{
                recordType: 'text',
                language: 'en',
                text: data
            }]
        });

        console.log('✓ Data written to NFC tag successfully');
        return true;
    } catch (error) {
        console.error('NFC Writing Error:', error);
        throw error;
    }
};

/**
 * Create an NFC record for a specific task
 */
export const createTaskNFCRecord = (taskId: string, taskTitle: string): string => {
    return JSON.stringify({
        type: 'task',
        taskId,
        taskTitle,
        timestamp: Date.now()
    });
};

/**
 * Parse NFC data and extract task information
 */
export const parseNFCTaskData = (data: string): { taskId: string; taskTitle: string; timestamp: number } | null => {
    try {
        const parsed = JSON.parse(data);
        if (parsed.type === 'task' && parsed.taskId) {
            return {
                taskId: parsed.taskId,
                taskTitle: parsed.taskTitle || 'Unknown Task',
                timestamp: parsed.timestamp || Date.now()
            };
        }
        return null;
    } catch (error) {
        console.error('Failed to parse NFC task data:', error);
        return null;
    }
};

/**
 * Get NFC device information (if available)
 */
export const getNFCDeviceInfo = (): { supported: boolean; message: string } => {
    if (!isNFCSupported()) {
        return {
            supported: false,
            message: 'NFC is not supported on this device. Please use an Android device with NFC capability.'
        };
    }
    
    return {
        supported: true,
        message: 'NFC is available on this device'
    };
};

/**
 * Create an NFC location tag
 */
export const createLocationNFCRecord = (lat: number, lng: number, locationName: string): string => {
    return JSON.stringify({
        type: 'location',
        latitude: lat,
        longitude: lng,
        name: locationName,
        timestamp: Date.now()
    });
};

/**
 * Parse location data from NFC tag
 */
export const parseLocationNFCData = (data: string): { latitude: number; longitude: number; name: string; timestamp: number } | null => {
    try {
        const parsed = JSON.parse(data);
        if (parsed.type === 'location') {
            return {
                latitude: parsed.latitude,
                longitude: parsed.longitude,
                name: parsed.name || 'Unknown Location',
                timestamp: parsed.timestamp || Date.now()
            };
        }
        return null;
    } catch (error) {
        console.error('Failed to parse NFC location data:', error);
        return null;
    }
};
