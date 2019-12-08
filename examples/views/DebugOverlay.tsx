import * as React from "react";
import {useCallback, useState} from "react";
import {AsyncStateOverlay, useAsyncState} from "../..";
import {FoodItem, getList} from "../api";

const DebugOverlay: React.FC = () => {
    const [list, _, updateList] = useAsyncState([] as FoodItem[]);
    const [itemCount, setItemCount] = useState(1);
    const [debug, setDebug] = useState(false);

    const fetch = useCallback(async () => {
        const sent = Date.now();
        const {resolvedAt} = await updateList(async () => {
            const response = await getList(itemCount);
            return response.data;
        }, {refresh: true});

        console.log(`Took ${(resolvedAt || 0) - sent}ms`);
    }, [itemCount]);

    return <div>
        <h3>Debug Overlay</h3>
        <AsyncStateOverlay debug={debug}
                           state={list}
                           style={{border: "1px solid #ddd", padding: "5px", width: "500px"}}>{list => <div>
            <label>Debug:</label>
            <input type={"checkbox"} checked={debug} onChange={(e) => setDebug(e.target.checked)}/>
            <br/>
            <label>Number of Items:</label>
            <input value={itemCount}
                   onChange={(e) => setItemCount(parseInt(e.target.value))}
                   type={"number"}
                   min={1}
                   max={12}/>
            <button disabled={list.pending} onClick={fetch}>Fetch</button>

            <br/>
            <b>List of {list.value?.length} value(s):</b> {list.pending && <i>Loading...</i>}
            <ul>
                {list.value?.map((value, index) => {
                    return <li key={index}>
                        <span style={{
                            width: "26px",
                            display: "inline-block"
                        }}>{value.icon}</span><span>{value.name}</span>
                    </li>;
                })}
            </ul>
        </div>}
        </AsyncStateOverlay>
    </div>;
};

export default DebugOverlay;