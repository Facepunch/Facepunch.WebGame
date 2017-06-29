namespace Facepunch {
    export interface ILoadable {
        loadNext(callback: (requeue: boolean) => void): void;
        getLoadPriority(): number;
        getLoadProgress(): number;
    }

    export interface ILoader {
        update(requestQuota: number): number;
        getLoadProgress(): number;
    }
    
    export abstract class Loader<TLoadable extends ILoadable> implements ILoader {
        private queue: TLoadable[] = [];
        private loaded: { [url: string]: TLoadable } = {};
        private active: TLoadable[] = [];
        private completed = 0;

        load(url: string): TLoadable {
            let loaded = this.loaded[url];
            if (loaded != null) return loaded;

            loaded = this.onCreateItem(url);
            this.loaded[url] = loaded;

            this.enqueueItem(loaded);
            return loaded;
        }

        getLoadProgress(): number {
            let total = this.queue.length + this.active.length + this.completed;
            let complete = this.completed;

            for (let item of this.queue) complete += item.getLoadProgress();
            for (let item of this.active) complete += item.getLoadProgress();

            return total > 0 ? complete / total : 0;
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
            while (this.active.length < requestQuota && (next = this.getNextToLoad()) != null) {
                this.active.push(next);

                const nextCopy = next;
                next.loadNext(requeue => {
                    this.active.splice(this.active.indexOf(nextCopy), 1);
                    if (requeue) this.queue.push(nextCopy);
                    else ++this.completed;
                    this.onFinishedLoadStep(nextCopy);
                });
            }

            return this.active.length;
        }
    }
}