/*export const toStateful = <T>(promise: Promise<T>): StatefulPromise<T> => {
    const stateful: StatefulPromise<T> = Object.assign(
        promise,
        create<T>(undefined, { pending: true }),
    ) as any;
    return stateful.then(
        (data) => {
            Object.assign(stateful, resolve(stateful, data));
            return data;
        },
        (error: Error) => {
            Object.assign(stateful, reject(stateful, error));
            throw error;
        },
    );
};*/