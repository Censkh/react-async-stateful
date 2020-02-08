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

export const getList = async (
  itemCount?: number
): Promise<Response<Array<FoodItem>>> => {
  await new Promise(resolve => setTimeout(resolve, 2500));

  itemCount =
    itemCount !== undefined ? itemCount : 2 + Math.ceil(Math.random() * 5);
  const set = new Set<number>();
  while (set.size < itemCount && set.size !== food.length) {
    set.add(Math.floor(Math.random() * food.length));
  }

  return {
    status: 200,
    data: Array.from(set).map(index => food[index])
  };
};

export const getComplexData = async (): Promise<Response<ComplexData>> => {
  const levels = await Promise.all(
    "0"
      .repeat(10)
      .split("")
      .map(async () => {
        const response = await getList(2 + Math.floor(Math.random() * 10));
        return response.data;
      })
  );

  return {
    status: 200,
    data: {
      currentLevel: 3,
      levels: levels
    }
  };
};
