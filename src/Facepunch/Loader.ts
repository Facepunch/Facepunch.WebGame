namespace Facepunch {
    export interface ILoadable {
        loadNext(callback: (requeue: boolean) => void): void;
        getLoadPriority(): number;
    }

    export interface ILoader {
        update(requestQuota: number): number;
    }
    
    export abstract class Loader<TLoadable extends ILoadable> implements ILoader {
        private queue: TLoadable[] = [];
        private loaded: { [url: string]: TLoadable } = {};
        private active = 0;
        private completed = 0;

        load(url: string): TLoadable {
            let loaded = this.loaded[url];
            if (loaded != null) return loaded;

            loaded = this.onCreateItem(url);
            this.loaded[url] = loaded;

            this.enqueueItem(loaded);
            return loaded;
        }

        getQueueCount(): number {
            return this.queue.length;
        }

        getActiveCount(): number {
            return this.active;
        }

        getCompletedCount(): number {
            return this.completed;
        }

        getTotalCount(): number {
            return this.queue.length + this.active + this.completed;
        }

        protected enqueueItem(item: TLoadable): void {
            this.queue.push(item);
        }

        protected abstract onCreateItem(url: string): TLoadable;

        protected onFinishedLoadStep(item: TLoadable): void { }

        private getNextToLoad(): TLoadable {
            if (this.queue.length <= 0) return null;

            let bestIndex = -1;
            let bestItem = this.queue[0];
            let bestPriority = 0;

            for (var i = 0, iEnd = this.queue.length; i < iEnd; ++i) {
                const item = this.queue[i];
                const priority = item.getLoadPriority();
                if (priority <= bestPriority) continue;

                bestIndex = i;
                bestItem = item;
                bestPriority = priority;
            }

            if (bestIndex === -1) return null;

            return this.queue.splice(bestIndex, 1)[0];
        }

        update(requestQuota: number): number {
            let next: TLoadable;
            while (this.active < requestQuota && (next = this.getNextToLoad()) != null) {
                ++this.active;

                const nextCopy = next;
                next.loadNext(requeue => {
                    --this.active;
                    if (requeue) this.queue.push(nextCopy);
                    else ++this.completed;
                    this.onFinishedLoadStep(nextCopy);
                });
            }

            return this.active;
        }
    }
}