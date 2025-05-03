

export default function SignalSelector({key, name, Click}){
    return(
        <label key={key} className="signal-label" onClick={(key) => Click(key)}>{name}</label>
    );

}