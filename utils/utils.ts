export const delay = async (delayInms: number) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(2);
        }, delayInms);
    });
};
