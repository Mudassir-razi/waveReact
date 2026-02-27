export function manageTabs(allTabsData, selectedTabIndex, command, newCurrentTabData=[], newCurrentAnnotationData=[])
{
    var newAllTabsData = structuredClone(allTabsData);

    switch(command)
    {
        case 'add':{
            //do stuff
            const NameSuffix = String(allTabsData.length);
            const newTab = {name : "New tab " + NameSuffix, waveform : [], annotation : []};
            newAllTabsData.push(newTab);
            break;
        }
        case 'sub':{
            if(newAllTabsData.length === 1)
            {
                alert("Last Tab is sacred. can't delete it");
                break;
            }
            newAllTabsData.splice(selectedTabIndex, 1);
            break;
        }
        case 'mod':
        {
            newAllTabsData[selectedTabIndex].waveform = newCurrentTabData;
            newAllTabsData[selectedTabIndex].annotation = newCurrentAnnotationData;
            break;
        }
        default : 
        {
            //do nothing
        }
    }
    return newAllTabsData;
}