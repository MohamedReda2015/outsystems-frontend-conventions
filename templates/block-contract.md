# Block contract: `<BlockName>`

> One per public CW block. Paste a short version into the block's Description in Service Studio. Rules: `BLK-*`, `NAM-*` in `references/review-checklist.md`.

| Field | Value |
|---|---|
| Module / UI flow | `<Concept>_CW` / `<Concept>` |
| Purpose (one sentence) | |
| Public | Yes / No (why) |
| Used by | screens / blocks that consume it |
| Owner | team or person |

## Input parameters
| Name | Type | Mandatory | Default | Meaning |
|---|---|---|---|---|
| `RequestId` | Request Identifier (Long Integer) | Yes | | the record to show |
| `IsReadOnly` | Boolean | No | False | hides edit actions |
| `RefreshToken` | Integer | No | 0 | increment to force a reload with the same parameters |

## Events
| Name | Parameters | Mandatory | Raised when |
|---|---|---|---|
| `OnSaved` | `RequestId` | No | the save succeeded |
| `OnCancelled` | | No | the user cancelled |

## Placeholders
| Name | Expected content |
|---|---|
| `Actions` | extra buttons from the parent (optional) |

## Data
| Source | Fetch | Calls (BL) | Refreshed when |
|---|---|---|---|
| `GetRequestDetail` | At Start | `Request_GetDetail` | `OnParametersChanged`, after save |

## States
- Loading: …
- Empty: …
- Error (`FetchError`): message + Retry
- Populated: …
- Saving: Button Loading on Save; inputs read-only

## Lifecycle handlers
| Event | Does |
|---|---|
| OnInitialize | |
| OnReady | |
| OnParametersChanged | Refresh `GetRequestDetail`; reset `HasChanges` |
| OnDestroy | |

## Server calls from user actions
| Handler | Server action (one per action) | Result handling |
|---|---|---|
| `SaveOnClick` | `Request_Save(RequestInput)` → `ActionResult` + `RequestId` | branch on `Code` (`CONCURRENT_UPDATE` → reload offer); `Errors` → inputs; success → `OnSaved` |

## CSS API (see the style guide)
Prefix: `req-`. Classes: `req-card`, `req-card__title`. Knobs: `--req-card-padding`.

## Exceptions
- Caught inside the block (shown inline): …
- Left to the consuming screen's flow handler (`ERR-06`): …

## Security notes
- Permission flags returned by: `GetRequestDetail.CanEdit` (server-computed).
- Server re-checks: role + ownership + state in `Request_Save`.

## Change log
| Date | Change | Breaking? |
|---|---|---|


## Evidence and acceptance

- Platform/app type, installed versions/theme where relevant, target environment:
- Existing project decisions and authorized delivery scope:
- Requirement → element/contract → source of data → verification evidence:
- Concurrency, retry/unknown outcome, authorization and failure cases relevant to this change:
- Delivery status: prepared / model validated / merged / published / runtime verified (record only observed stages):
- Not tested, missing dependency or blocked evidence, and the exact next step:
