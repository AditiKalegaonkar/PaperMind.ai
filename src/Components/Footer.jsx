import React from "react";
import './Footer.css'
function Footer() {
    return(
        <section className="end quicksand">
            <p>© All Rights Reserved By PaperMind.ai {new Date().getFullYear()}</p>
        </section>
    );
}

export default Footer;