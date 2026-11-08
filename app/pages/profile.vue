<script setup lang="ts">
import ProfileView from '~/components/views/Profile.vue'
import { PRIVATE_ROBOTS } from '~/composables/useSeo'

definePageMeta({ middleware: 'auth' })

useSeo({ title: '个人资料', robots: PRIVATE_ROBOTS })
</script>

<template>
  <ProfileView />
</template>
