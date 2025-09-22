import { createRouter, createWebHashHistory } from 'vue-router';
import DiaryList from '../views/DiaryList.vue';
import DiaryForm from '../views/DiaryForm.vue';
import DiaryDetail from '../views/DiaryDetail.vue';

const routes = [
  {
    path: '/',
    name: 'home',
    component: DiaryList,
  },
  {
    path: '/new',
    name: 'newDiary',
    component: DiaryForm,
    props: { mode: 'create' },
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
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
