<script>
  import detectEthereumProvider from "@metamask/detect-provider";
  import { onMount } from "svelte";

  export let signer = "";
  export let addresses = [];
  export let chainId = "";

  async function handleChainId(_chainId) {
    if (_chainId) {
      chainId = _chainId;
      console.log("handleChainId", chainId, signer, addresses);
    }
  }
  async function handleAccounts(_accounts) {
    if (_accounts.length === 0) {
      connectMetamask();
    } else if (_accounts[0] !== signer) {
      signer = _accounts[0];
      if (addresses.indexOf(signer) === -1) {
        addresses.push(signer);
        console.log("handleAccounts", chainId, signer, addresses);
      }
    }
  }
  async function connectMetamask() {
    console.log("connectMetamask");

    ethereum
      .request({ method: "eth_requestAccounts" })
      .then(handleAccounts)
      .catch((e) => {
        if (e.code === 4001) {
          alert("Please connect to MetaMask.");
        } else {
          console.error("ERROR eth_requestAccounts", e);
        }
      });
  }
  async function init() {
    console.log("init");
    const provider = await detectEthereumProvider();
    if (provider) {
      if (provider !== window.ethereum) {
        alert("Do you have multiple wallets installed?");
      }

      ethereum
        .request({ method: "eth_accounts" })
        .then(handleAccounts)
        .catch((e) => console.error("ERROR eth_accounts", e));

      ethereum
        .request({ method: "eth_chainId" })
        .then(handleChainId)
        .catch((e) => console.error("ERROR eth_chainId", e));

      ethereum.on("chainChanged", handleChainId);

      ethereum.on("accountsChanged", handleAccounts);
    } else {
      console.log("Please install MetaMask!");
    }
  }
  onMount(async function () {
    init();
  });
</script>

<div href="#" class="headerbutton w-inline-block">
  <div class="frostedglasswrapper left">
    <div class="frostedglasseffect notfixed" />
    <div class="blockcontents">
      {#if signer}
        <div id="identiconAddressImage" class="buttondisk fs-account-icon-wrapper">
          <img src="images/account_icon.svg" loading="lazy" id="platformLogo" alt="" class="placeholderimage {signer ? 'address-icon' : 'no-address-icon'}" />
        </div>
      {/if}
      <div id="userAddressSet" class="textdarkmode">
        {#if signer}
          <span>{signer.substr(0, 6) + "..." + signer.substring(signer.length - 4, signer.length)} </span>
        {:else}
          <span on:click={connectMetamask} class="connect-text" style="margin-left: 32px;">Connect wallet</span>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .connect-text {
    cursor: pointer;
  }

  .fs-account-icon-wrapper {
    display: flex;
    justify-content: center;
  }
  .address-icon {
    width: 80%;
  }

  .no-address-icon {
    opacity: 0;
  }
</style>
