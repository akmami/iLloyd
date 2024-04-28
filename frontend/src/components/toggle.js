import React from 'react';
import "../styles/toggle.css";

class Toggle extends React.Component {

    render() {
        
        const { text, toggleState, onToggle } = this.props;
        
        return (
            <div className="toggle">
                {text}
                <button onClick={onToggle}>
                    {toggleState ? "Deactivate" : "Activate"}
                </button>
            </div>
        );
    }
}
 
export default Toggle;