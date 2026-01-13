const connectBtn = document.getElementById("connectBtn");
const statusEl = document.getElementById("status");
const addressEl = document.getElementById("address");
const networkEl = document.getElementById("network");
const balanceEl = document.getElementById("balance");

const AVALANCHE_FUJI_CHAIN_ID = "0xa869";
let isConnecting = false;

// shorten address function
function shortenAddress(address) {
    if (!address) return "-";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

function formatAvaxBalance(balanceWei) {
    const balance = parseInt(balanceWei, 16);
    return (balance / 1e18).toFixed(4);
}

async function connectWallet() {
    if (isConnecting) return;
    if (typeof window.ethereum === "undefined") {
        statusEl.textContent = "Error: Core Wallet Not Found!";
        return;
    }

    try {
        isConnecting = true;
        statusEl.textContent = "Connecting... Check Wallet";

        const accounts = await window.ethereum.request({
            method: "eth_requestAccounts",
        });

        const address = accounts[0];
        const chainId = await window.ethereum.request({ method: "eth_chainId" });

        addressEl.textContent = shortenAddress(address);

        if (chainId === AVALANCHE_FUJI_CHAIN_ID) {
            networkEl.textContent = "Avalanche Fuji Testnet";
            statusEl.textContent = "Connected ✅";
            statusEl.style.color = "#4cd137";

            const balanceWei = await window.ethereum.request({
                method: "eth_getBalance",
                params: [address, "latest"],
            });

            balanceEl.textContent = formatAvaxBalance(balanceWei);

            // disable button
            connectBtn.disabled = true;
            connectBtn.textContent = "Wallet Connected";
            connectBtn.style.opacity = "0.6";
        } else {
            networkEl.textContent = "Wrong Network ❌";
            statusEl.textContent = "Switch to Fuji Testnet!";
            statusEl.style.color = "#fbc531";
        }
    } catch (error) {
        console.error("Connection error:", error);
        if (error.code === -32002) {
            statusEl.textContent = "Pending: Check your wallet extension!";
        } else {
            statusEl.textContent = "Error: " + (error.message.includes("rejected") ? "User Rejected" : "Failed");
        }
        statusEl.style.color = "#e74c3c";
    } finally {
        isConnecting = false;
    }
}

// event listeners 
if (window.ethereum) {
    window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
            connectWallet(); 
        } else {
            location.reload();
        }
    });

    window.ethereum.on('chainChanged', () => {
        location.reload(); 
        console.log('Chain changed');
    });
}

connectBtn.addEventListener("click", connectWallet);