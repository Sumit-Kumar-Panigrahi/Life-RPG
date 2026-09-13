import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:4000/api';

describe('Life RPG Full-Stack E2E Flow (TZPSv2 Validation)', () => {
  const testUser = {
    username: `hero_${Date.now()}`,
    email: `hero_${Date.now()}@quest.realm`,
    password: 'MasterPassword123!',
    characterName: 'Arthurian Champion',
    avatarClass: 'WARRIOR'
  };

  let authCookie = '';
  let createdQuestId = 0;
  let starterQuestId = 0;

  test('1. User Signup & Character Initialization (Concrete System #1 & #2)', async () => {
    const res = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    assert.equal(res.status, 201, 'Signup should return 201 Created');
    const cookieHeader = res.headers.get('set-cookie');
    assert.ok(cookieHeader, 'Set-Cookie header must be present');
    authCookie = cookieHeader.split(';')[0];

    const data = await res.json();
    assert.equal(data.user.username, testUser.username);
    assert.equal(data.character.level, 1);
    assert.equal(data.character.gold, 50, 'Starting treasury should be 50 Gold');
    assert.equal(data.attributes.length, 6, 'All 6 attributes should be initialized');
  });

  test('2. Read Quests & Verify Starter Quests (Concrete System #2)', async () => {
    const res = await fetch(`${BASE_URL}/quests`, {
      headers: { Cookie: authCookie }
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.quests.length >= 3, 'Starter quests should be seeded');
    starterQuestId = data.quests[0].id;
  });

  test('3. Create Custom Quest with Calculated Rewards (Concrete System #2 & #3)', async () => {
    const res = await fetch(`${BASE_URL}/quests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: authCookie
      },
      body: JSON.stringify({
        title: 'Master Algorithm Complexity',
        description: 'Complete 3 LeetCode Hard problems with full amortized proofs',
        category: 'KNOWLEDGE',
        difficulty: 'HARD',
        priority: 'HIGH'
      })
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.quest.title, 'Master Algorithm Complexity');
    assert.equal(data.quest.xp_reward, 140, 'HARD difficulty should reward 140 XP');
    assert.equal(data.quest.gold_reward, 55, 'HARD difficulty should reward 55 Gold');
    assert.equal(data.quest.attribute_target, 'INTELLECT');
    createdQuestId = data.quest.id;
  });

  test('4. Complete Quest & Verify Non-Linear Level Up & Rewards (Concrete Systems #3, #4, #5, #6)', async () => {
    // Current Level is 1 (needs 100 XP to level up). Hard quest gives 140 XP.
    // Result should trigger a level up to Level 2 with 40 XP carried over!
    const res = await fetch(`${BASE_URL}/quests/${createdQuestId}/complete`, {
      method: 'POST',
      headers: { Cookie: authCookie }
    });

    assert.equal(res.status, 200);
    const data = await res.json();

    // Verification of progression engine
    assert.equal(data.rewards.isLevelUp, true, 'Quest should trigger a level-up');
    assert.equal(data.rewards.newLevel, 2, 'New level should be 2');
    assert.equal(data.character.level, 2, 'Character level updated in database');
    assert.equal(data.character.current_xp, 40, '40 XP should carry over to Level 2');
    assert.equal(data.character.gold, 50 + 55, 'Gold should increase by 55');
    assert.equal(data.rewards.streak, 1, 'Streak should initialize to 1 day');

    // Verification of attribute improvement
    const intellect = data.attributes.find(a => a.attribute_name === 'INTELLECT');
    assert.ok(intellect.points >= 25, 'Intellect points should increase');
  });

  test('5. Prevent Duplicate XP Exploitation (Anti-Cheat Security)', async () => {
    // Attempting to complete the same quest again must be blocked
    const res = await fetch(`${BASE_URL}/quests/${createdQuestId}/complete`, {
      method: 'POST',
      headers: { Cookie: authCookie }
    });

    assert.equal(res.status, 400, 'Duplicate completion must return 400 Bad Request');
    const data = await res.json();
    assert.ok(data.error.includes('already been completed'));
  });

  test('6. Shop Catalog, Affordability Checks, and Virtual Purchases (Concrete System #6)', async () => {
    // Get shop items
    const itemsRes = await fetch(`${BASE_URL}/shop/items`, {
      headers: { Cookie: authCookie }
    });
    assert.equal(itemsRes.status, 200);
    const shopData = await itemsRes.json();
    assert.ok(shopData.items.length >= 10);
    assert.equal(shopData.goldBalance, 105);

    // Purchase 'title-code-wizard' (cost 75 Gold)
    const purchaseRes = await fetch(`${BASE_URL}/shop/purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: authCookie
      },
      body: JSON.stringify({ itemId: 'title-code-wizard' })
    });

    assert.equal(purchaseRes.status, 200);
    const purchaseData = await purchaseRes.json();
    assert.equal(purchaseData.remainingGold, 105 - 75, 'Treasury deducted accurately (30 Gold left)');

    // Attempt to buy an expensive item without enough gold (cost 180 Gold)
    const failRes = await fetch(`${BASE_URL}/shop/purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: authCookie
      },
      body: JSON.stringify({ itemId: 'theme-solarized' })
    });
    assert.equal(failRes.status, 400, 'Insufficient gold must be rejected');

    // Equip purchased title
    const equipRes = await fetch(`${BASE_URL}/shop/equip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: authCookie
      },
      body: JSON.stringify({ itemId: 'title-code-wizard' })
    });
    assert.equal(equipRes.status, 200);
    const equipData = await equipRes.json();
    assert.equal(equipData.character.active_title, 'Code Wizard');
  });

  test('7. Data Persistence Verification across Session Reload (TZPSv2 Core Requirement)', async () => {
    // Fetch profile fresh as if refreshing browser
    const profileRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Cookie: authCookie }
    });

    assert.equal(profileRes.status, 200);
    const profile = await profileRes.json();

    assert.equal(profile.character.level, 2, 'Level 2 persisted');
    assert.equal(profile.character.current_xp, 40, 'XP persisted');
    assert.equal(profile.character.gold, 30, 'Gold persisted');
    assert.equal(profile.character.active_title, 'Code Wizard', 'Equipped title persisted');
    assert.equal(profile.character.current_streak, 1, 'Streak persisted');
    assert.ok(profile.inventory.some(i => i.item_id === 'title-code-wizard'), 'Purchased item persisted in inventory');
  });

  describe('Google OAuth 2.0 Security & Identity Resolution Tests', () => {
    test('8. Google OAuth Status Endpoint', async () => {
      const res = await fetch(`${BASE_URL}/auth/google/status`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(typeof data.configured, 'boolean');
    });

    test('9. Google OAuth Cancellation Handling', async () => {
      // Simulate user clicking "Cancel" on Google consent screen
      const res = await fetch(`${BASE_URL}/auth/google/callback?error=access_denied`, {
        redirect: 'manual'
      });
      assert.equal(res.status, 302, 'Should redirect back to frontend');
      const location = res.headers.get('location');
      assert.ok(location.includes('auth_error=oauth_cancelled'), 'Should redirect with oauth_cancelled error');
    });

    test('10. Google OAuth CSRF State Protection', async () => {
      // Missing or forged state parameter
      const res = await fetch(`${BASE_URL}/auth/google/callback?code=mock_code&state=forged_state`, {
        redirect: 'manual'
      });
      assert.equal(res.status, 302);
      const location = res.headers.get('location');
      assert.ok(location.includes('auth_error=invalid_oauth_state'), 'Should reject mismatched OAuth state');
    });

    test('11. First-Time Google User Resolution & RPG Initialization', async () => {
      const googleProfile = {
        email: `google_valiant_${Date.now()}@gmail.com`,
        name: 'Sir Google Valiant',
        sub: `google_sub_${Date.now()}`
      };

      const res = await fetch(`${BASE_URL}/auth/google/simulate-callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(googleProfile)
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.user.id, 'User ID must be assigned');
      assert.equal(data.user.email, googleProfile.email);
      assert.equal(data.character.character_name, googleProfile.name);
      assert.equal(data.character.level, 1, 'Google user starts at level 1');
      assert.equal(data.character.gold, 50, 'Google user receives 50 gold starting treasury');
      assert.equal(data.attributes.length, 6, 'All 6 RPG attributes must be initialized');

      // Check starter quests
      const questsRes = await fetch(`${BASE_URL}/quests`, {
        headers: { Authorization: `Bearer ${data.token}` }
      });
      const questsData = await questsRes.json();
      assert.ok(questsData.quests.length >= 3, 'Google user should receive starter quests');

      // 12. Returning Google User - Same Identity Preserved
      const returnRes = await fetch(`${BASE_URL}/auth/google/simulate-callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(googleProfile)
      });
      assert.equal(returnRes.status, 200);
      const returnData = await returnRes.json();
      assert.equal(returnData.user.id, data.user.id, 'Existing Google user must retain the exact same user ID');
      assert.equal(returnData.user.email, googleProfile.email);
    });

    test('13. Forgot Password & Reset Password Flow', async () => {
      // 1. Request Reset Code
      const forgotRes = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername: testUser.email })
      });
      assert.equal(forgotRes.status, 200, 'Forgot password request should return 200');
      const forgotData = await forgotRes.json();
      assert.ok(forgotData.code, 'Reset code should be generated');

      // 2. Reset Password with Code
      const newPass = 'BrandNewSecretPassword2026!';
      const resetRes = await fetch(`${BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOrUsername: testUser.email,
          token: forgotData.code,
          newPassword: newPass
        })
      });
      assert.equal(resetRes.status, 200, 'Password reset should succeed');

      // 3. Login with New Password
      const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOrUsername: testUser.username,
          password: newPass
        })
      });
      assert.equal(loginRes.status, 200, 'Login with new password should succeed');
    });
  });
});

