<script>
  export let value;
  export let options;
  let isDropdownOpen = false;

  const setValue = (addr) => {
    isDropdownOpen = false;
    value = addr;
  };
  $: console.log("ADDRESS LISTBOX VALUE", value);

  const truncateAddress = (addr) => (addr ? addr.substr(0, 12) + "..." + addr.substring(addr.length - 4, addr.length) : "");
</script>

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
      {truncateAddress(value) || "Select address"}
    </div>
  </div>
  <nav class:w--open={isDropdownOpen} class="dropdown-list w-dropdown-list" id="w-dropdown-list-0" aria-labelledby="w-dropdown-toggle-0">
    {#if options && options.length > 0}
      {#each options as addr}
        <div on:click={() => setValue(addr)} id="accItem-01" class="dropdownitem w-dropdown-link" style="cursor: pointer;" tabindex="0">
          {truncateAddress(addr)}
        </div>
      {/each}
    {:else}
      <div href="#" id="accItem-01" class="dropdownitem w-dropdown-link" tabindex="0">Loading...</div>
    {/if}
  </nav>
</div>

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
