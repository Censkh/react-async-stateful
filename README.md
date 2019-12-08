# [react-async-stateful](https://github.com/Censkh/react-async-stateful/) &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/Censkh/react-async-stateful/blob/master/LICENSE) [![npm version](https://img.shields.io/npm/v/react-async-stateful.svg?style=flat)](https://www.npmjs.com/package/react-async-stateful)

## What is it?

We have our 

```jsx harmony
import {useAsyncState} from "react-async-stateful";

const AsyncComponent = (props) => {
    const [submitResult, _, updateSubmitResult] = useAsyncState();    

    const submit = useCallback(() => {
        const {resolvedAt} = updateSubmitResult(async () => {
            const response = await fetch("https://example.com/api/v1/squeal-loudly");
            return response.json();
        });
        console.log(`API responded at: ${new Date(resolvedAt).toString()}`)
    });
    
    return <div>
        <button onClick={submit}>Call the API!</button>
        {submitResult.resolved && <div>The response: {JSON.stringify(submitResult.value)}</div>}
    </div>;
};
```