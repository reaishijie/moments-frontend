<script setup lang="ts" name="Header">
import { computed, ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useUserStore } from '~/store/user'
import { UserCircleRegular, Hive, Camera, Search } from '@vicons/fa'
import Icon from '~/components/utils/VIcon.vue'
import { useAuthStore } from '~/store/auth'
import { useDefaultStore } from '~/store/default'
import { useNoticeStore } from '~/store/notice'
import NoticePopover from '~/components/notice/NoticePopover.vue'

const router = useRouter()


const authStore = useAuthStore()
const userStore = useUserStore()
const defaultStore = useDefaultStore()
const noticeStore = useNoticeStore()
let noticeTimer: number | undefined
const props = defineProps({
  headerBackgroundUrl: { type: String, default: '' }
})

// 默认背景图
const defaultBackground = '/img/background.mp4'
// 获取背景路径（优先使用用户配置）
const backgroundPath = computed(() => {
  return props.headerBackgroundUrl || defaultStore.configs.site_header_background || defaultBackground
})
const backgroundExtension = computed(() => {
  const cleanPath = backgroundPath.value.split(/[?#]/)[0] ?? ''
  return cleanPath.split('.').pop()?.toLowerCase()
})
// 判断文件类型
const isImage = computed(() => {
  const imageExtension = ['jpg', 'png', 'webp', 'svg', 'gif', 'avif', 'jpeg']
  return backgroundExtension.value ? imageExtension.includes(backgroundExtension.value) : false
})
const isVideo = computed(() => {
  const videoExtension = ['mp4', 'webm', 'ogg', 'mov']
  return backgroundExtension.value ? videoExtension.includes(backgroundExtension.value) : false
})

const backgroundVideoRef = ref<HTMLVideoElement | null>(null)
const tryPlayBackgroundVideo = async () => {
  await nextTick()
  const video = backgroundVideoRef.value
  if (!video) return

  video.muted = true
  video.defaultMuted = true
  video.playsInline = true
  video.setAttribute('muted', '')
  video.setAttribute('playsinline', '')
  video.setAttribute('webkit-playsinline', '')
  video.setAttribute('x5-playsinline', '')
  video.setAttribute('x5-video-player-type', 'h5')
  video.setAttribute('x5-video-player-fullscreen', 'false')

  try {
    await video.play()
  } catch {
    // 微信内置浏览器可能仍会按系统策略阻止自动播放，保留首帧/海报展示。
  }
}

watch(backgroundPath, () => {
  if (isVideo.value) {
    void tryPlayBackgroundVideo()
  }
}, { flush: 'post' })

// 顶栏
// 模糊
const isBlurred = ref(false)
let observer: IntersectionObserver | null = null
// 挂载时
onMounted(() => {
  const headerEl = document.querySelector('.header')
  if (headerEl) {
    observer = new IntersectionObserver(
      entries => {
        const entry = entries[0]
        if (!entry) return
        // entry.isIntersecting 是一个布尔值，表示目标元素是否在视口中。
        isBlurred.value = !entry.isIntersecting //在视口中就不模糊
      },
      {
        // root用于指定容器，null表示使用浏览器视口作为根容器
        root: null,
        // 触发函数：目标元素与根元素相交的比例 0- 1，0表示刚接触，1表示全部元素相交； 可以是一个数组多次触发[0, 0.5, 1]
        threshold: 0
      }
    )
    observer.observe(headerEl)
  }

  void tryPlayBackgroundVideo()
  if (isLogin.value) {
    void noticeStore.fetchUnreadCount()
    noticeTimer = window.setInterval(() => {
      if (isLogin.value) void noticeStore.fetchUnreadCount()
    }, 60000)
  }
})
onUnmounted(() => {
  if (observer) observer.disconnect()
  if (noticeTimer) window.clearInterval(noticeTimer)

})

// 根据token判断用户是否登录
const isLogin = computed(() => !!userStore.accessToken)
watch(isLogin, (value) => {
  if (value) {
    void noticeStore.fetchUnreadCount()
    if (!noticeTimer) {
      noticeTimer = window.setInterval(() => {
        if (isLogin.value) void noticeStore.fetchUnreadCount()
      }, 60000)
    }
  } else {
    noticeStore.unreadCount = 0
    if (noticeTimer) {
      window.clearInterval(noticeTimer)
      noticeTimer = undefined
    }
  }
})
</script>

<template>

  <div class="header">
    <div class="background">
      <!-- 如果设置为图片 -->
      <img v-if="isImage" :src="backgroundPath" alt="顶部图片" decoding="async" fetchpriority="high" />
      <!-- 如果设置为视频 -->
      <video
v-else-if="isVideo" ref="backgroundVideoRef" :src="backgroundPath" autoplay muted loop playsinline
        webkit-playsinline x5-playsinline x5-video-player-type="h5" x5-video-player-fullscreen="false" preload="auto" />
      <!-- 其他 -->
      <video
v-else ref="backgroundVideoRef" :src="defaultBackground" autoplay muted loop playsinline webkit-playsinline
        x5-playsinline x5-video-player-type="h5" x5-video-player-fullscreen="false" preload="auto" />
    </div>
    <!-- 顶部导航栏 -->
    <div class="top-bar-wrapper">
      <div :class="['top-bar', { blurred: isBlurred }]">

        <div class="top-bar-left">
          <slot name="left" :is-blurred="isBlurred">
            <button
              v-if="!isLogin"
              type="button"
              class="icon-button"
              title="登录/注册"
              aria-label="登录或注册"
              @click="authStore.showAuth"
            >
              <Icon :class="['icon', { blurred: isBlurred }]">
                <UserCircleRegular />
              </Icon>
            </button>
          </slot>
        </div>

        <div class="top-bar-right">
          <slot name="right" :is-blurred="isBlurred">
            <button
              v-if="isLogin"
              type="button"
              class="icon-button addArticle"
              title="发表文章"
              aria-label="发表文章"
              @click="router.push('/post')"
            >
              <Icon :class="['icon', { blurred: isBlurred }]">
                <Camera />
              </Icon>
            </button>
            <NoticePopover v-if="isLogin" :is-blurred="isBlurred" />
            <button
              type="button"
              class="icon-button"
              title="搜索"
              aria-label="搜索内容"
              @click="router.push('/search')"
            >
              <Icon :class="['icon', { blurred: isBlurred }]">
                <Search />
              </Icon>
            </button>
            <button
              type="button"
              class="icon-button"
              title="友情链接"
              aria-label="友情链接"
              @click="router.push('/links')"
            >
              <Icon :class="['icon', { blurred: isBlurred }]">
                <Hive />
              </Icon>
            </button>
          </slot>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
/* 顶部容器 */
.header {
  width: 100%;
  height: 40vh;
  position: relative;
}

/* 背景 */
.background {
  width: 100%;
  height: 100%;
  /* overflow: hidden; */
}

/* 顶部 图片/视频  */
.background img,
video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

/* 栏外层 */
.top-bar-wrapper {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: min(100%, 520px);
  /* width: 100%; */
  z-index: 10;
}

/* 栏本身 */
.top-bar {
  display: flex;
  width: 100%;
  justify-content: space-between;
  background-color: rgba(255, 255, 255, 0);
  transition: backdrop-filter 0.3s ease, background-color 0.3s ease;
  padding: 10px;
  box-sizing: border-box;
}

/* 模糊状态 */
.top-bar.blurred {
  backdrop-filter: blur(8px);
  background-color: var(--top-bar);
}

.icon {
  font-size: 20px;
  color: #EEE9E9;
  margin: 0;
}

.icon:hover {
  color: #C8C2C2;
  cursor: pointer;
}

.icon.blurred {
  font-size: 20px;
  color: #898888;
}

.icon.blurred:hover {
  color: #5f5e5e;
}

.top-bar-right {
  display: flex;
  align-items: center;
  /* 统一间距：32px 按钮 + 4px gap，图标之间视觉间距为 16px */
  gap: 4px;
}

.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 8px;
  padding: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.icon-button:focus-visible {
  outline: 2px solid #6cadf1;
  outline-offset: 2px;
  border-radius: 6px;
}
</style>
