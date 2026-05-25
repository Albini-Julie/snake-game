<template>
  <img :src="icons[name]" :class="sizeClass" aria-hidden="true" />
</template>

<script setup>
import IconOctopus from "@/assets/icons/octopus.svg?url";
import IconSword from "@/assets/icons/sword.svg?url";
import IconSearch from "@/assets/icons/search.svg?url";
import IconAdd from "@/assets/icons/add.svg?url";
import IconLink from "@/assets/icons/link.svg?url";
import IconFirst from "@/assets/icons/first.svg?url";
import IconSecondary from "@/assets/icons/secondary.svg?url";
import IconThird from "@/assets/icons/third.svg?url";
import IconCrown from "@/assets/icons/crown.svg?url";

const icons = {
  octopus: IconOctopus,
  sword: IconSword,
  search: IconSearch,
  add: IconAdd,
  link: IconLink,
  first: IconFirst,
  secondary: IconSecondary,
  third: IconThird,
  crown: IconCrown,
};

const props = defineProps({
  name: { type: String, required: true },
  size: { type: String, default: "md" },
});

const sizeClass = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-8 h-8" }[props.size];
</script>
