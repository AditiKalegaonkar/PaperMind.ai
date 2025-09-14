function Login() {
    return (
        <div style={{ padding: "2rem", textAlign: "center" }}>
            <h2>Login Page</h2>
            <form style={{ display: "inline-block", marginTop: "1rem" }}>
                <div style={{ marginBottom: "1rem" }}>
                    <input type="email" placeholder="Email" />
                </div>
                <div style={{ marginBottom: "1rem" }}>
                    <input type="password" placeholder="Password" />
                </div>
                <button type="submit">Login</button>
            </form>
        </div>
    );
}

export default Login;
