#!/usr/bin/env python3
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
app=(ROOT/'js/tablegate/shell/app.js').read_text()
state=(ROOT/'js/tablegate/shell/state.js').read_text()
config=(ROOT/'js/tablegate/shell/config.js').read_text()
backend=(ROOT/'backend/api/tablegate-backend-v8.gs').read_text()
views=(ROOT/'js/tablegate/shell/views.js').read_text()
checks=[]
def c(name,ok,detail=''):
    checks.append({'name':name,'passed':bool(ok),'details':detail})
c('authoritative backend URL', 'AKfycbyqw2pg_-I8i8j8i8p' not in config and 'AKfycbyqw2pg_-I8i8jP-nIVq4ATC_bw0fRNFi_yhM044TnbRtbuiEt98Btg1Q0ZnQRsIpItag' in config)
c('backend library version 10', "BACKEND_LIBRARY_VERSION: '10'" in config)
c('demo mode session scoped', 'sessionStorage' in state and "modeSet(value)" in state)
c('logout returns to backend mode', "setMode('backend');" in app and "api = createApi();" in app[app.index("case 'logout'"):app.index("case 'logout'")+600])
c('login supports optional 2FA challenge', 'twoFactorRequired' in app and "authTab = 'twofactor'" in app)
c('registration does not require verification', 'verificationRequired:false' in backend and 'emailVerified:false' in backend)
c('community verification gate exists', 'requireEmailVerifiedForCommunity_' in backend)
for fn in ['routeCreateTablegate_','routeJoinPublicTablegate_','routeRequestTablegateJoin_','routeJoinInvite_','routeCreateGroupFinderPost_','routeExpressGroupFinderInterest_','routeSendMessage_','routeCreateDm_','routeCreateGroupDm_']:
    m=re.search(r'function '+fn+r'\(ctx\)\s*\{([^}]*)',backend)
    c(fn+' email gate', bool(m and 'requireEmailVerifiedForCommunity_' in m.group(1) or m and 'requireMessengerVerified_' in m.group(1)))
for action in ['followUser','unfollowUser','listFollowers','listFollowing','setFollowNotificationPreference','getUserProfile','verifyTwoFactor','requestPhoneVerification','verifyPhone','getTwoFactor','setTwoFactor','resendTwoFactor','listSharedLibrary','getSharedLibraryFile']:
    c('backend action '+action, bool(re.search(r'\b'+re.escape(action)+r':\{fn:',backend)))
c('public profile UI', 'public-profile' in views and 'followerCount' in views and 'followingCount' in views)
c('profile URL UI', 'Profile URL' in views and 'profileSlug' in views)
report={'ok':all(x['passed'] for x in checks),'checks':checks}
print(json.dumps(report,indent=2))
(Path(ROOT/'docs/manifests/frontend-repair-audit.json')).write_text(json.dumps(report,indent=2)+'\n')
raise SystemExit(0 if report['ok'] else 1)
