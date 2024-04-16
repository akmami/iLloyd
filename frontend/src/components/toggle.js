import React from 'react';
 
class Toggle extends React.Component {

    render() {
        
        const { text, toggleState, onToggle } = this.props;
        
        return (
            <div>
                {text}
                <button onClick={onToggle}>
                    {toggleState ? "Deactivate" : "Activate"}
                </button>
            </div>
        );
    }
}
 
export default Toggle;