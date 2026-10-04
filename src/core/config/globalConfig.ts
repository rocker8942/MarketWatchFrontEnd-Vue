const GlobalConfig = {
    "APIServer": import.meta.env.VITE_API_SERVER || (
        import.meta.env.PROD
            ? "https://marketwatch.moneystock.net"
            : "https://localhost:44324"
    )
}

export default GlobalConfig;
