import * as React from "react";
import {useCallback, useState} from "react";
import {lens, useAsyncState} from "react-async-stateful";
import {ComplexData, getComplexData} from "../api";
import {isResolved, match} from "../../../src";

const Lens: React.FC = () => {
    const [data, _, updateData] = useAsyncState<ComplexData>();
    const [level, setLevel] = useState(0);

    const fetch = useCallback(async () => {
        updateData(async () => {
            const response = await getComplexData();
            return response.data;
        }, {refresh: true});
    }, []);

    const list = lens(data, (value) => value.levels[value.currentLevel] ?? [], []);

    return <div>
        <h3>Lens</h3>
        <button disabled={data.pending} onClick={fetch}>Get Data</button>
        <br/>
        <p>
            <span>Level: </span>
            {match(data, {
                "pristine": <>unknown</>,
                "resolved": value => <>{level} / 10 {value.currentLevel === level && <span style={{color: "green"}}>(current level!)</span>}</>,
                "rejected": error => <span style={{color: "red"}}>Error occurred: {error.message}</span>
            }, <i>loading...</i>)}
        </p>

        {isResolved(data) && <div>
            <input disabled={data.pending} type={"range"} value={level} min={0} max={9} onChange={e => setLevel(parseInt(e.target.value))}/>
        </div>}

        <b>List of {list.value.length} value(s):</b>
        <ul>
            {list.value.map((value, index) => {
                return <li key={index}>
                        <span style={{
                            width: "26px",
                            display: "inline-block"
                        }}>{value.icon}</span><span>{value.name}</span>
                </li>;
            })}
        </ul>
    </div>;
};

export default Lens;