import dns from "dns";

// Windows/local DNS often fails MongoDB Atlas SRV lookups (querySrv ECONNREFUSED).
dns.setServers(["8.8.8.8", "1.1.1.1"]);
