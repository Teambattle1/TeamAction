
import { supabase } from '../lib/supabase';

class TimeService {
  private offset: number = 0;
  private isSynced: boolean = false;

  constructor() {
    this.sync();
  }

  public async sync() {
    try {
      const start = Date.now();
      // Simple RPC to get server time, or select now() if no RPC
      const { data, error } = await supabase.rpc('get_server_time'); // We will add this RPC in AdminModal
      
      const end = Date.now();
      const latency = (end - start) / 2;

      if (!error && data) {
        const serverTime = new Date(data).getTime();
        this.offset = serverTime - (Date.now() - latency); // Calculate offset relative to device time
        this.isSynced = true;
        console.log(`[TimeService] Synced. Offset: ${this.offset}ms`);
      } else {
        // Fallback if RPC doesn't exist yet
        console.warn("[TimeService] Sync failed, using local time.");
      }
    } catch (e) {
      console.error("[TimeService] Error syncing time", e);
    }
  }

  public now(): number {
    return Date.now() + this.offset;
  }

  public getDate(): Date {
    return new Date(this.now());
  }
}

export const timeService = new TimeService();
