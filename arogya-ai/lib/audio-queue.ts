// ──────────────────────────────────────────────────────────
// Audio Queue — plays audio chunks in order, supports
// emergency interrupt and autoplay-blocked fallback.
// ──────────────────────────────────────────────────────────

type QueueItem = {
    url: string;
    priority: "normal" | "urgent";
};

export class AudioQueue {
    private queue: QueueItem[] = [];
    private isPlaying = false;
    private currentAudio: HTMLAudioElement | null = null;
    private onPlaybackBlocked?: () => void;

    constructor(opts?: { onPlaybackBlocked?: () => void }) {
        this.onPlaybackBlocked = opts?.onPlaybackBlocked;
    }

    /**
     * Add an audio URL to the queue. Urgent items interrupt
     * any currently playing audio and jump to front.
     */
    add(url: string, priority: "normal" | "urgent" = "normal") {
        if (!url) return;

        if (priority === "urgent") {
            // Interrupt current playback
            this.stop();
            this.queue.unshift({ url, priority });
        } else {
            this.queue.push({ url, priority });
        }

        if (!this.isPlaying) {
            this.playNext();
        }
    }

    /**
     * Stop the currently playing audio and clear the queue.
     */
    stop() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.src = "";
            this.currentAudio = null;
        }
        this.isPlaying = false;
    }

    /**
     * Clear the queue without stopping current playback.
     */
    clear() {
        this.queue = [];
    }

    private async playNext() {
        if (this.queue.length === 0) {
            this.isPlaying = false;
            return;
        }

        this.isPlaying = true;
        const item = this.queue.shift()!;

        try {
            const audioSrc = item.url.startsWith("http")
                ? item.url
                : `data:audio/mp3;base64,${item.url}`;

            const audio = new Audio(audioSrc);
            this.currentAudio = audio;

            // Set volume higher for urgent messages
            audio.volume = item.priority === "urgent" ? 1.0 : 0.85;

            await audio.play().catch(() => {
                // Autoplay blocked (e.g. Safari) — notify caller
                this.onPlaybackBlocked?.();
            });

            // Wait for audio to finish
            await new Promise<void>((resolve) => {
                audio.onended = () => resolve();
                audio.onerror = () => resolve();
            });

            // For urgent messages, repeat once
            if (item.priority === "urgent") {
                const repeatAudio = new Audio(audioSrc);
                repeatAudio.volume = 1.0;
                await repeatAudio.play().catch(() => {});
                await new Promise<void>((resolve) => {
                    repeatAudio.onended = () => resolve();
                    repeatAudio.onerror = () => resolve();
                });
            }
        } catch {
            // Audio play failed — continue to next item
        }

        this.currentAudio = null;
        this.playNext();
    }
}

// Singleton instance
let _instance: AudioQueue | null = null;

export function getAudioQueue(opts?: { onPlaybackBlocked?: () => void }): AudioQueue {
    if (!_instance) {
        _instance = new AudioQueue(opts);
    }
    return _instance;
}
