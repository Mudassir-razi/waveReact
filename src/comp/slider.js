//import { useEffect, useRef } from "react";

export default function Slider({name, value, onChange, min, max, step}) {

    return (
        <div style={{display: "flex", flexDirection: "column" , margin: "10px"}}>
            <label>{name}</label>
            <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(e.target.value)} />
        </div>
    );

}