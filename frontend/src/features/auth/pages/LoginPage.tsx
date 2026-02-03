import React from "react";
import { useLocation } from "react-router-dom";

export const LoginPage: React.FC = () => {
    const location = useLocation();
    const from = location.state?.from;

    return (
        <div>
            <h1>Login Page</h1>
            {
            from && (
                <p style = {{color: "red"}}>
                    You need to have the necessary role to access <strong>{from}</strong>
                </p>
            )
            }
        </div>
    )
}