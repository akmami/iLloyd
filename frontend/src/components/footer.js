import React from 'react';
import '../styles/footer.css';

function Footer() {

    const year = new Date().getFullYear();

    return (
        <footer className="footer">
            {`Copyright © Impoved Lloyd's Algorithm ${year}`}
        </footer>
    );
}

export default Footer;