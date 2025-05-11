export default function LabelInput({id, text, selectionIndex, onClick, normalClass, selectClass})
{

    return(
        <label key = {id} onClick={() => onClick(id)} className={ selectionIndex === id ? selectClass : normalClass}  >{text}</label>
    );
}