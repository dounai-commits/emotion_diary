import { createRouter, createWebHashHistory } from 'vue-router';
import DiaryList from '../views/DiaryList.vue';
import DiaryForm from '../views/DiaryForm.vue';
import DiaryDetail from '../views/DiaryDetail.vue';
import DiaryAnalysis from '../views/DiaryAnalysis.vue';
import Settings from '../views/Settings.vue';

const routes = [
  {
    path: '/',
    name: 'home',
    component: DiaryList,
    meta: { showBottomNav: true },
  },
  {
    path: '/new',
    name: 'newDiary',
    component: DiaryForm,
    props: { mode: 'create' },
    meta: { showBottomNav: true },
  },
  {
    path: '/diary/:id',
    name: 'diaryDetail',
    component: DiaryDetail,
    props: true,
  },
  {
    path: '/diary/:id/edit',
    name: 'editDiary',
    component: DiaryForm,
    props: route => ({ mode: 'edit', id: route.params.id }),
  },
  {
    path: '/diary/:id/analysis',
    name: 'diaryAnalysis',
    component: DiaryAnalysis,
    props: true,
  },
  {
    path: '/insights',
    name: 'insights',
    component: () => import('../views/TrendInsights.vue'),
    meta: { showBottomNav: true },
  },
  {
    path: '/settings',
    name: 'settings',
    component: Settings,
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
