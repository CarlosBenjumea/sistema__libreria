export const ACTIVE_USER_STORAGE_KEY = 'activeUserId';
export const ACTIVE_USER_CHANGED_EVENT = 'active-user-changed';
export const USERS_UPDATED_EVENT = 'users-updated';

export function getActiveUserIdFromStorage() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(ACTIVE_USER_STORAGE_KEY) || '';
}

export function setActiveUserIdInStorage(userId) {
  if (typeof window === 'undefined') return;
  const normalizedUserId = userId ? String(userId) : '';
  localStorage.setItem(ACTIVE_USER_STORAGE_KEY, normalizedUserId);
  window.dispatchEvent(
    new CustomEvent(ACTIVE_USER_CHANGED_EVENT, {
      detail: { userId: normalizedUserId },
    })
  );
}

export function subscribeActiveUserChanges(callback) {
  if (typeof window === 'undefined') return () => {};

  const handleCustomEvent = (event) => {
    const userId = event?.detail?.userId ?? getActiveUserIdFromStorage();
    callback(String(userId || ''));
  };

  const handleStorageEvent = (event) => {
    if (event.key !== ACTIVE_USER_STORAGE_KEY) return;
    callback(String(event.newValue || ''));
  };

  window.addEventListener(ACTIVE_USER_CHANGED_EVENT, handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);

  return () => {
    window.removeEventListener(ACTIVE_USER_CHANGED_EVENT, handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
  };
}

export function notifyUsersUpdated() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(USERS_UPDATED_EVENT));
}

export function subscribeUsersUpdated(callback) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(USERS_UPDATED_EVENT, callback);
  return () => window.removeEventListener(USERS_UPDATED_EVENT, callback);
}
