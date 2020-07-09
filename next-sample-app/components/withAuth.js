import React, { Component } from "react";
import { env } from "./config"
import {
    msalApp,
    requiresInteraction,
} from "./auth-utils";

export default C =>
    class extends Component {
        constructor(props) {
            super(props);

            this.state = {
                is_b2b: false,
                account: null,
                error: null,
            };
        }

        async acquireToken(request) {
            return msalApp.acquireTokenSilent(request).catch(error => {
                // Call acquireTokenPopup (popup window) in case of acquireTokenSilent failure
                // due to consent or interaction required ONLY
                if (requiresInteraction(error.errorCode)) {
                    return msalApp.acquireTokenRedirect({
                            ...request,
                            redirectUri: env.auth.redirectURL
                        });
                } else {
                    console.error('Non-interactive error:', error.errorCode)
                }
            });
        }

        async onSignIn() {
            return msalApp.loginRedirect({
                "scopes": env.auth.loginScopes,
                redirectUri: env.auth.redirectURL 
            });

        }

        onSignOut() {
            msalApp.logout();
        }

        async componentDidMount() {
            msalApp.handleRedirectCallback(error => {
                if (error) {
                    const errorMessage = error.errorMessage ? error.errorMessage : "Unable to acquire access token.";
                    // setState works as long as navigateToLoginRequestUrl: false
                    this.setState({
                        error: errorMessage
                    });
                }
            });

            const account = msalApp.getAccount();
            const is_b2b = (env.authScheme === 'B2B');

            this.setState({
                account,
                is_b2b
            });
        }

        render() {
            return (
                <C
                    {...this.props}
                    is_b2b={this.state.is_b2b}
                    account={this.state.account}
                    error={this.state.error}
                    onSignIn={() => this.onSignIn()}
                    onSignOut={() => this.onSignOut()}
                    acquireToken={(request) => this.acquireToken(request)}
                />
            );
        }
    };