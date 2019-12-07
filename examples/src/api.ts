import food from "./food";

export const getList = async (itemCount?: number): Promise<any> => {
    await new Promise(resolve => setTimeout(resolve, 2500));

    itemCount = itemCount !== undefined ? itemCount : 2 + Math.ceil(Math.random() * 5);
    const set = new Set<number>();
    while (set.size < itemCount && set.size !== food.length) {
        set.add(Math.floor(Math.random() * food.length));
    }

    return {
        status: 200,
        data: Array.from(set).map(index => food[index])
    };
};