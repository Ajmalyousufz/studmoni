import React, { useEffect, useState } from 'react'

function MyCounter({ title, place }) {

    const [count, setCount] = useState(0);

    useEffect(() => {
        console.log(`mounted`);
        console.log(`count : `, count);

        // return () => {
        //     console.log(`unmounted`);
        // }
    }, [count])
    //const {title,count} =props; thiis can replace in MyCounter(props) to MyCounter({title,count}){} ->  made same effect

    return (
        <div>
            <button onClick={() => setCount(count + 1)}>Add</button>
            <div>{title} {count} {place}</div>
        </div>
    )
}

export default MyCounter