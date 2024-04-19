import food from "./food";

export interface FoodItem {
  icon: string;
  name: string;
}

export interface Response<T> {
  status: number;
  data: T;
}

export interface ComplexData {
  currentLevel: number;
  levels: Array<Array<FoodItem>>;
}

export const getFoodList = async (options?: {
  itemCount?: number;
  search?: string;
}): Promise<Response<Array<FoodItem>>> => {
  const itemCount = options?.itemCount !== undefined ? options.itemCount : 2 + Math.ceil(Math.random() * 5);
  const set = new Set<number>();
  const foodList = food.filter(
    (item) => !options?.search || item.name.toLowerCase().includes(options.search.toLowerCase()),
  );
  while (set.size < itemCount && set.size !== foodList.length) {
    set.add(Math.floor(Math.random() * foodList.length));
  }

  return {
    status: 200,
    data: Array.from(set).map((index) => foodList[index]),
  };
};

export const getComplexData = async (): Promise<Response<ComplexData>> => {
  const levels = await Promise.all(
    "0"
      .repeat(10)
      .split("")
      .map(async () => {
        const response = await getFoodList({ itemCount: 2 + Math.floor(Math.random() * 10) });
        return response.data;
      }),
  );

  return {
    status: 200,
    data: {
      currentLevel: 3,
      levels: levels,
    },
  };
};
