/*export const useAsyncRecoilState = <T>(atom: RecoilState<AsyncState<T>>): [AsyncState<T>, SetterOrUpdater<AsyncState<T>>, UpdateAsyncStateFunction<T>] => {
  const [asyncState, setAsyncState] = useRecoilState(atom);
  const updateFn                    = useCallback<UpdateAsyncStateFunction<T>>(
    (promiseOrAsyncFn, options) =>
      updateAsyncState(setAsyncState, promiseOrAsyncFn, options),
    [setAsyncState],
  );

  return [asyncState, setAsyncState, updateFn];
};
*/
