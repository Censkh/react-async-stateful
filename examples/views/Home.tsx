import * as React from "react";
import Markdown from "react-markdown";

import {readFileSync} from 'fs';

const readme = readFileSync('./README.md', 'utf-8');

const Home: React.FC = () => {
    return <div>
        <Markdown source={readme}/>
    </div>;
};

export default Home;