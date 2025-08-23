export interface TimeData {
  startTime: number;
  endTime?: number;
  duration?: number;
}

export class TimeTracker {
  private timers: Map<string, TimeData> = new Map();

  start(id: string): void {
    this.timers.set(id, {
      startTime: Date.now()
    });
  }

  end(id: string): number {
    const timer = this.timers.get(id);
    if (!timer) {
      throw new Error(`Timer with id '${id}' not found`);
    }

    const endTime = Date.now();
    const duration = endTime - timer.startTime;
    
    this.timers.set(id, {
      ...timer,
      endTime,
      duration
    });

    return duration;
  }

  getDuration(id: string): number | undefined {
    const timer = this.timers.get(id);
    return timer?.duration;
  }

  formatDuration(milliseconds: number): string {
    if (milliseconds < 1000) {
      return `${milliseconds}ms`;
    }
    
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    }
    
    return `${seconds}s`;
  }

  clear(id?: string): void {
    if (id) {
      this.timers.delete(id);
    } else {
      this.timers.clear();
    }
  }
}