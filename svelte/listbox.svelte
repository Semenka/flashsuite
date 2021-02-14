<script>
  import Metamask from "./metamask.svelte";
  import { signer, addresses } from "./metamask.mjs";

  export let address;
  $: console.log("ADDRESS LISTBOX", address);

  let isDropdownOpen = false;

  const isSigner = (_address) => {
    return $signer && _address == $signer;
  };
  const setValue = (_address) => {
    address = _address;
    isDropdownOpen = false;
  };
  const truncateAddress = (_address) => (_address ? _address.substr(0, 12) + "..." + _address.substring(_address.length - 4, _address.length) : "");
</script>

{#key $signer}
  <div data-hover="" data-delay="0" class="adressdropdown w-dropdown" style="z-index: 901;">
    <div
      class="dropdown-toggle addresses w-dropdown-toggle w--open"
      on:click={() => {
        isDropdownOpen = !isDropdownOpen;
      }}
      id="w-dropdown-toggle-0"
      aria-controls="w-dropdown-list-0"
      aria-haspopup="menu"
      aria-expanded="true"
      role="button"
      tabindex="0"
    >
      <div class="arrow lightmode w-icon-dropdown-toggle" />
      <div id="platformAddressLogo" class="buttondisk">
        <img src="images/assets/aave_logo.svg" loading="lazy" id="platformLogo" alt="" class="placeholderimage" />
      </div>
      <div id="chosenAddressORG" class="textlightmode">
        {address ? truncateAddress(address) : "Select address"}
      </div>
    </div>
    <nav class:w--open={isDropdownOpen} class="dropdown-list w-dropdown-list" id="w-dropdown-list-0" aria-labelledby="w-dropdown-toggle-0">
      {#if $addresses && $addresses.length > 0}
        {#each $addresses as _address}
          <div on:click={() => setValue(_address)} id="accItem-01" class="dropdownitem w-dropdown-link" style="cursor: pointer;" tabindex="0">
            {truncateAddress(_address)}
            {#if isSigner(_address)}*{/if}
          </div>
        {/each}
      {:else}
        <div href="#" id="accItem-01" class="dropdownitem w-dropdown-link" tabindex="0">Loading...</div>
      {/if}
    </nav>
    <Metamask />
  </div>
{/key}

<style>
  .dropdown-list {
    border-radius: 10px;
  }

  .buttondisk {
    flex-shrink: 0;
    height: 42px;
    width: 42px;
  }
</style>
