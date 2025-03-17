;; ======================
;; TITLE: TTT-V01
;; VERSION: 0.0.0.1
;; SUMMARY: Basic tic-tac-toe game engine (single creator)
;; ======================


;; ======================
;; CONSTANTS
;; ======================

;; Game Lobby Constants
(define-constant contract-owner tx-sender)
(define-constant contract-deployer "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM")
(define-constant contract-name "ttt-v01")
(define-constant game-id u2)
(define-constant players-allowed u2)

;; Currency Constants
(define-constant currency-stx u1)
(define-constant currency-sbtc u2)

;; Host Constants
(define-constant web-host "https://www.deorganized.games")
(define-constant api-host "https://deorganized-games-api.vercel.app")

;; Bomb Constants
(define-constant bomb-cost-percentage u50)  ;; 50% of buy-in
(define-constant max-bombs-per-match u3)
(define-constant item-bomb u1)  ;; In case we add more items later

;; Creator Fee Schedule Constants
(define-constant creator-info { 
  creator-1: {
    percent-of-100: u100,
    name: "DeOrganized",
    address: 'ST3VZSF1PEM2Q1780M589P5DT53W4Y0YK4M3T7923  ;; Get Mainnet Address
  }
})


;; ======================
;; ERROR CONSTANTS
;; ======================

;; Common Errors (2000-2099)
(define-constant err-unknown-game (err u2000))
(define-constant err-unknown-contract (err u2001))
(define-constant err-unknown-match (err u2002))
(define-constant err-unknown-recipient (err u2003))

;; Auth Errors (2100-2199)
(define-constant err-unauthorized (err u2100))
(define-constant err-invalid-fee-config (err u2101))

;; Game Specific Errors (3000-3099)
(define-constant err-match-in-progress (err u3000))
(define-constant err-match-over (err u3001))
(define-constant err-incorrect-buy-in (err u3002))
(define-constant err-not-enough-players (err u3003))
(define-constant err-too-many-players (err u3004))
(define-constant err-incorrect-player (err u3005))
(define-constant err-greater-than-zero (err u3006))
(define-constant err-square-occupied (err u3007))
(define-constant err-invalid-currency (err u3008))
(define-constant err-distribution-failed (err u3009))
(define-constant err-distribution-sbtc-failed (err u3010))
(define-constant err-no-bombs-remaining (err u3011))
(define-constant err-square-empty (err u3012))
(define-constant err-insufficient-bomb-payment (err u3013))

;; HTTP-like Errors (4000-4099)
(define-constant err-not-found (err u4004))


;; ======================
;; TOKEN DEFINITIONS
;; ======================

;; NFT collection that stores match history
(define-non-fungible-token tic-tac-toe-1 uint)


;; ======================
;; DATA VARS
;; ======================

;; Nonce Counters
(define-data-var turn-nonce uint u0)

;; Lobby Information
(define-data-var lobby-name (string-ascii 255) "DeOrganized Alpha Arena")
(define-data-var lobby-description (string-ascii 255) "Home of the DeOrganized Gaming Alpha players. Only the most OG of the OGs will have awards from matches hosted here.")
(define-data-var host-domain (string-ascii 255) "deorganized-games-api.vercel.app")
(define-data-var lobby-host principal tx-sender)
(define-data-var lobby-status uint u0)
(define-data-var lobby-fee-of-100 uint u50)
(define-data-var players-joined uint u0)
(define-data-var last-match-id uint u0)
(define-data-var match-in-progress bool false)
(define-data-var buy-in uint u1000000)
(define-data-var buy-in-sbtc uint u150000)
(define-data-var is-high-stakes bool true)
(define-data-var active-player-id uint u1)
(define-data-var current-turn uint u1)

;; Preferred Currency
(define-data-var preferred-currency uint currency-stx)

;; Timeout Intervals
(define-data-var match-timeout-interval uint u5)
(define-data-var lobby-timeout-interval uint u25000)

;; Bomb Variables
(define-data-var bombs-remaining uint u3)
(define-data-var item-nonce uint u0)


;; ======================
;; DATA MAPS
;; ======================

;; Current Lobby Players
(define-map players uint { player: principal})

;; Historical Record of Match Winner Data
(define-map match-winners { match-id: uint } {
  match-kitty: uint,
  match-winner: (optional principal),
  award-owner: principal,
  currency-type: uint
})

;; Historical Record of Match Move Data
(define-map match-data { match-id: uint, square: uint } { 
  turn: uint,
  player-number: uint,
  player: principal
})

;; Add new map to track claims
(define-map draw-claims { match-id: uint, player: principal } { claimed: bool })

;; Add to DATA MAPS section
(define-map item-data { match-id: uint, item-id: uint } {
    item-type: uint,
    square: uint,
    used-by: principal,
    turn: uint
})


;; ======================
;; PUBLIC FUNCTIONS
;; ======================

;; Claim match win and receive rewards
(define-public (claim (match-id uint))
  (begin 
    (asserts! (<= match-id (var-get last-match-id)) err-not-found)
    (asserts! (is-some (get match-winner (map-get? match-winners { match-id: match-id }))) err-unauthorized)
    (asserts! (is-eq (unwrap-panic (get match-winner (unwrap-panic (map-get? match-winners { match-id: match-id })))) tx-sender) err-unauthorized)
    
    (unwrap-panic (mint tx-sender match-id))
          
    ;; Distribute STX winnings
    (if (> (stx-get-balance (as-contract tx-sender)) u0) 
      (unwrap-panic (as-contract (stx-transfer? 
        (get match-kitty (unwrap-panic (map-get? match-winners { match-id: match-id })))
        (as-contract tx-sender) 
        (unwrap-panic (get match-winner (unwrap-panic (map-get? match-winners { match-id: match-id }))))))) 
      false)

    ;; Distribute sBTC winnings
    (if (> (unwrap-panic (contract-call? .sbtc-token get-balance (as-contract tx-sender))) u0) 
      (unwrap-panic (as-contract (contract-call? .sbtc-token transfer
        (unwrap-panic (contract-call? .sbtc-token get-balance (as-contract tx-sender)))
        (as-contract tx-sender) 
        (unwrap-panic (get match-winner (unwrap-panic (map-get? match-winners { match-id: match-id }))))
        none))) 
      false)

    (print { 
      eventName: "rt-match-claimed", 
      eventData: {
        contract-deployer: contract-deployer,
        contract-name: contract-name,
        game-id: game-id,
        lobby-name: (var-get lobby-name),
        lobby-description: (var-get lobby-description),
        match-index: match-id,
        winner: tx-sender
      }
    })

    (ok true)
  )
)

;; Claim match win and receive rewards
(define-public (claim-draw (match-id uint))
  (let (
    (match-winner-data (unwrap! (map-get? match-winners { match-id: match-id }) err-not-found))
    (kitty (get match-kitty match-winner-data))
    (claimer tx-sender)
  )
  (begin 
    (asserts! (<= match-id (var-get last-match-id)) err-not-found)
    (asserts! (is-none (get match-winner match-winner-data)) err-unauthorized)
    
    ;; Check if player already claimed
    (asserts! (is-none (map-get? draw-claims { match-id: match-id, player: claimer })) err-unauthorized)

    ;; Mark as claimed before transfer
    (map-set draw-claims { match-id: match-id, player: claimer } { claimed: true })
    
    ;; Verify player was in the match by checking all squares for their moves
    (asserts! (or 
      (match (map-get? match-data { match-id: match-id, square: u0 })
        square-data (is-eq tx-sender (get player square-data))
        false)
      (match (map-get? match-data { match-id: match-id, square: u1 })
        square-data (is-eq tx-sender (get player square-data))
        false)
      (match (map-get? match-data { match-id: match-id, square: u2 })
        square-data (is-eq tx-sender (get player square-data))
        false)
      (match (map-get? match-data { match-id: match-id, square: u3 })
        square-data (is-eq tx-sender (get player square-data))
        false)
      (match (map-get? match-data { match-id: match-id, square: u4 })
        square-data (is-eq tx-sender (get player square-data))
        false)
      (match (map-get? match-data { match-id: match-id, square: u5 })
        square-data (is-eq tx-sender (get player square-data))
        false)
      (match (map-get? match-data { match-id: match-id, square: u6 })
        square-data (is-eq tx-sender (get player square-data))
        false)
      (match (map-get? match-data { match-id: match-id, square: u7 })
        square-data (is-eq tx-sender (get player square-data))
        false)
      (match (map-get? match-data { match-id: match-id, square: u8 })
        square-data (is-eq tx-sender (get player square-data))
        false)
    ) err-unauthorized)
          
    ;; Distribute STX winnings - should be 50% of kitty
    (if (and 
        (> kitty u0)
        (is-eq (get currency-type (unwrap! (map-get? match-winners { match-id: match-id }) err-not-found)) currency-stx))
      (unwrap! (as-contract (stx-transfer? 
        (/ kitty u2)
        tx-sender  ;; The contract itself, due to the as-contract
        claimer))  ;; The original caller, set in the let statement
        err-distribution-failed)
      true)

    ;; Distribute sBTC winnings - should be 50% of balance
    (if (and
        (> (unwrap-panic (contract-call? .sbtc-token get-balance (as-contract tx-sender))) u0)
        (is-eq (get currency-type (unwrap! (map-get? match-winners { match-id: match-id }) err-not-found)) currency-sbtc))
      (unwrap! (contract-call? .sbtc-token transfer
        (/ (unwrap-panic (contract-call? .sbtc-token get-balance (as-contract tx-sender))) u2)
        (as-contract tx-sender)  ;; sender
        claimer                  ;; recipient
        none)
        err-distribution-sbtc-failed)
      true)

    (print { 
      eventName: "rt-match-claimed", 
      eventData: {
        contract-deployer: contract-deployer,
        contract-name: contract-name,
        game-id: game-id,
        lobby-name: (var-get lobby-name),
        lobby-description: (var-get lobby-description),
        match-index: match-id,
        winner: tx-sender
      }
    })

    (ok true)
  ))
)

;; Use a bomb
(define-public (use-bomb (square uint))
    (let (
        (bomb-cost (* (/ (var-get buy-in) u100) bomb-cost-percentage))
        (current-match-id (+ (var-get last-match-id) u1))
        (square-data (map-get? match-data { match-id: current-match-id, square: square }))
    )
    (begin
        ;; Validations
        (asserts! (var-get match-in-progress) err-match-over)
        (asserts! (> (var-get bombs-remaining) u0) err-no-bombs-remaining)
        (asserts! (< square u9) err-greater-than-zero)
        (asserts! (>= square u0) err-greater-than-zero)
        (asserts! (is-some square-data) err-square-empty)

        ;; Process payment and distribute to creators
        (try! (distribute-fees bomb-cost))
        
        ;; Update bomb count
        (var-set bombs-remaining (- (var-get bombs-remaining) u1))
        
        ;; Increment item nonce
        (var-set item-nonce (+ (var-get item-nonce) u1))
        
        ;; Store bomb usage data
        (map-set item-data 
            { match-id: current-match-id, item-id: (var-get item-nonce) }
            {
                item-type: item-bomb,
                square: square,
                used-by: tx-sender,
                turn: (var-get turn-nonce)
            }
        )
        
        ;; Remove the move from the square
        (map-delete match-data { match-id: current-match-id, square: square })

        ;; Emit event
        (print { 
            eventName: "rt-process-item", 
            eventData: {
                contract-deployer: contract-deployer,
                contract-name: contract-name,
                game-id: game-id,
                lobby-name: (var-get lobby-name),
                lobby-description: (var-get lobby-description),
                match-index: current-match-id,
                turn: (var-get turn-nonce),
                square: square,
                item-id: (var-get item-nonce),
                item-type: item-bomb,
                used-by: tx-sender,
                fee-amount: bomb-cost
            }
        })

        (ok true)
    ))
)

;; Process a player's turn
(define-public (process-turn (turn uint) (player-number uint) (square uint))
  (begin
    ;; Validation
    (asserts! (is-eq (var-get match-in-progress) true) err-match-over)
    (asserts! (is-eq player-number (var-get active-player-id)) err-incorrect-player)
    (asserts! (< square u9) err-greater-than-zero)
    (asserts! (>= square u0) err-greater-than-zero)
    (asserts! (is-none (map-get? match-data { match-id: (+ (var-get last-match-id) u1), square: square })) err-square-occupied)

    ;; Store turn data
    (map-set match-data {match-id: (+ (var-get last-match-id) u1), square: square } { 
      turn: (var-get turn-nonce),
      player-number: player-number,
      player: (get player (unwrap-panic (map-get? players player-number)))
    })

    (var-set turn-nonce (+ (var-get turn-nonce) u1))

    (if (is-winner)
      (begin 
        ;; Store Winner
        (map-set match-winners { match-id: (+ (var-get last-match-id) u1) } {
          match-kitty: (* (/ (var-get buy-in) u100) (* (- u100 (var-get lobby-fee-of-100)) u2)),
          match-winner: (some tx-sender),
          award-owner: (get player (unwrap-panic (map-get? players player-number))),
          currency-type: (var-get preferred-currency)
        })

        (print { 
          eventName: "rt-process-turn", 
          eventData: {
            contract-deployer: contract-deployer,
            contract-name: contract-name,
            game-id: game-id,
            lobby-name: (var-get lobby-name),
            lobby-description: (var-get lobby-description),
            match-index: (+ (var-get last-match-id) u1),
            turn: turn,
            square: square,
            player-number: player-number,
            player: tx-sender
          }
        })

        (var-set lobby-status u2)

        (print { 
          eventName: "rt-match-won", 
          eventData: {
            contract-deployer: contract-deployer,
            contract-name: contract-name,
            game-id: game-id,
            lobby-name: (var-get lobby-name),
            lobby-description: (var-get lobby-description),
            match-index: (+ (var-get last-match-id) u1),
            turn: turn,
            square: square,
            player-number: player-number,
            player: tx-sender
          }
        })

        (reset-match)
        
        (ok true)
      )
      
      (begin 
        (print { 
          eventName: "rt-process-turn", 
          eventData: {
            contract-deployer: contract-deployer,
            contract-name: contract-name,
            game-id: game-id,
            lobby-name: (var-get lobby-name),
            lobby-description: (var-get lobby-description),
            match-index: (+ (var-get last-match-id) u1),
            turn: turn,
            square: square,
            player-number: player-number,
            player: tx-sender
          }
        })

        ;; Switch active player
        (if (is-eq (var-get active-player-id) u1)
          (var-set active-player-id u2) 
          (var-set active-player-id u1)
        )
        
        ;; Check for draw
        (if (is-eq (var-get turn-nonce) u9)
          (begin 
            (map-set match-winners { match-id: (+ (var-get last-match-id) u1) } {
              match-kitty: (* (/ (var-get buy-in) u100) (* (- u100 (var-get lobby-fee-of-100)) u2)),
              match-winner: none,
              award-owner: (as-contract tx-sender),
              currency-type: (var-get preferred-currency)
            })

            (var-set lobby-status u2)

            (print { 
              eventName: "rt-match-draw", 
              eventData: {
                contract-deployer: contract-deployer,
                contract-name: contract-name,
                game-id: game-id,
                lobby-name: (var-get lobby-name),
                lobby-description: (var-get lobby-description),
                match-index: (+ (var-get last-match-id) u1),
                turn: turn,
                square: square,
                player-number: player-number,
                player: tx-sender
              }
            })

            (reset-match)  
          )
          false
        )

        (ok false)
      )
    )
  )
)


;; Transfer match award
(define-public (transfer (match-id uint) (sender principal) (recipient principal))
  (begin
    (asserts! (<= match-id (var-get last-match-id)) err-unknown-match)
    (asserts! (is-eq tx-sender sender) err-unauthorized)
    (asserts! (not (is-eq recipient (as-contract tx-sender))) err-unknown-recipient)

    (print { 
      eventName: "rt-award-transfer", 
      eventData: {
        contract-deployer: contract-deployer,
        contract-name: contract-name,
        game-id: game-id,
        lobby-name: (var-get lobby-name),
        lobby-description: (var-get lobby-description),
        match-index: match-id,
        sender: sender,
        recipient: recipient
      }
    })

    (nft-transfer? tic-tac-toe-1 match-id sender recipient)
  )
)


;; Tip team in STX
(define-public (tip-team (tip-amount uint)) 
  (begin
    (asserts! (> tip-amount u0) err-greater-than-zero)

    (print { 
      eventName: "rt-team-tipped", 
      eventData: {
        contract-deployer: contract-deployer,
        contract-name: contract-name,
        game-id: game-id,
        lobby-name: (var-get lobby-name),
        lobby-description: (var-get lobby-description),
        match-index: (+ (var-get last-match-id) u1),
        tip-amount: tip-amount,
        sender: tx-sender
      }
    })

    (ok (distribute-fees tip-amount))
  )
)


;; Tip team in sBTC
(define-public (tip-team-sbtc (tip-amount uint)) 
  (begin
    (asserts! (> tip-amount u0) err-greater-than-zero)

    (print { 
      eventName: "rt-team-tipped-sbtc", 
      eventData: {
        contract-deployer: contract-deployer,
        contract-name: contract-name,
        game-id: game-id,
        lobby-name: (var-get lobby-name),
        lobby-description: (var-get lobby-description),
        match-index: (+ (var-get last-match-id) u1),
        tip-amount: tip-amount,
        sender: tx-sender
      }
    })

    (ok (distribute-fees-sbtc tip-amount))
  )
)


;; Buy into match with STX
(define-public (player-buy-in (player principal) (amount uint))
  (begin
    (asserts! (< (var-get players-joined) players-allowed) err-too-many-players)
    (asserts! (is-eq (var-get match-in-progress) false) err-match-in-progress)
    (asserts! (is-eq player tx-sender) err-unauthorized)
    (asserts! (is-eq amount (var-get buy-in)) err-incorrect-buy-in)
    
    ;; Check for existing player
    (asserts! (and 
      (or 
        (is-eq (var-get players-joined) u0)
        (not (is-eq tx-sender (get player (unwrap-panic (map-get? players u1)))))
      )
      true
    ) err-unauthorized)

    (map-insert players (+ (var-get players-joined) u1) { player: player })
    (var-set players-joined (+ (var-get players-joined) u1))

    (print { 
      eventName: "rt-player-joined", 
      eventData: {
        contract-deployer: contract-deployer,
        contract-name: contract-name,
        game-id: game-id,
        lobby-name: (var-get lobby-name),
        lobby-description: (var-get lobby-description),
        match-index: (+ (var-get last-match-id) u1),
        player: tx-sender,
        player-number: (var-get players-joined),
        sender: tx-sender
      }
    })

    (try! (distribute-fees (* (/ amount u100) (var-get lobby-fee-of-100))))
    (stx-transfer? (* (/ amount u100) (- u100 (var-get lobby-fee-of-100))) tx-sender (as-contract tx-sender))
  )
)


;; Buy into match with sBTC
(define-public (player-buy-in-sbtc (player principal) (amount uint))
  (begin
    (asserts! (< (var-get players-joined) players-allowed) err-too-many-players)
    (asserts! (is-eq (var-get match-in-progress) false) err-match-in-progress)
    (asserts! (is-eq player tx-sender) err-unauthorized)
    (asserts! (is-eq amount (var-get buy-in-sbtc)) err-incorrect-buy-in)
    
    ;; Check for existing player
    (asserts! (and 
      (or 
        (is-eq (var-get players-joined) u0)
        (not (is-eq tx-sender (get player (unwrap-panic (map-get? players u1)))))
      )
      true
    ) err-unauthorized)

    (map-insert players (+ (var-get players-joined) u1) { player: player })
    (var-set players-joined (+ (var-get players-joined) u1))

    (print { 
      eventName: "rt-player-joined-sbtc", 
      eventData: {
        contract-deployer: contract-deployer,
        contract-name: contract-name,
        game-id: game-id,
        lobby-name: (var-get lobby-name),
        lobby-description: (var-get lobby-description),
        match-index: (+ (var-get last-match-id) u1),
        player: tx-sender,
        player-number: (var-get players-joined),
        sender: tx-sender
      }
    })

    (try! (distribute-fees-sbtc (* (/ amount u100) (var-get lobby-fee-of-100))))
    (contract-call? .sbtc-token transfer 
      (* (/ amount u100) (- u100 (var-get lobby-fee-of-100))) 
      tx-sender 
      (as-contract tx-sender) 
      none)
  )
)

;; Burn match award NFT
(define-public (burn-award (match-id uint))
  (begin
    (asserts! (<= match-id (var-get last-match-id)) err-unknown-match)
    ;; Verify sender owns the NFT
    (asserts! (is-eq (some tx-sender) (nft-get-owner? tic-tac-toe-1 match-id)) err-unauthorized)
    
    (print { 
      eventName: "rt-award-burned", 
      eventData: {
        contract-deployer: contract-deployer,
        contract-name: contract-name,
        game-id: game-id,
        lobby-name: (var-get lobby-name),
        lobby-description: (var-get lobby-description),
        match-index: match-id,
        burned-by: tx-sender
      }
    })

    (nft-burn? tic-tac-toe-1 match-id tx-sender)
  )
)


;; Start match
(define-public (start-match) 
  (begin
    (asserts! (>= (var-get players-joined) u2) err-not-enough-players)
    (asserts! (is-eq (var-get match-in-progress) false) err-match-in-progress)
    (asserts! (or 
      (is-eq (get player (unwrap-panic (map-get? players u1))) tx-sender) 
      (is-eq (get player (unwrap-panic (map-get? players u2))) tx-sender)) 
      err-unauthorized
    )

    (print { 
      eventName: "rt-match-started", 
      eventData: {
        contract-deployer: contract-deployer,
        contract-name: contract-name,
        game-id: game-id,
        lobby-name: (var-get lobby-name),
        lobby-description: (var-get lobby-description),
        match-index: (+ (var-get last-match-id) u1),
        started-by: tx-sender
      }
    })
    
    (var-set match-in-progress true)
    (var-set lobby-status u1)
    (var-set active-player-id u1)
    (var-set turn-nonce u0)
    (ok (+ (var-get last-match-id) u1))
  )
)


;; ======================
;; READ ONLY FUNCTIONS
;; ======================

;; Get game information
(define-read-only (get-game-info) 
  (ok {
    id: game-id,
    lobby-name: (var-get lobby-name),
    lobby-description: (var-get lobby-description),
    matches-played: (var-get last-match-id),
    buy-in: (var-get buy-in),
    buy-in-sbtc: (var-get buy-in-sbtc),
    preferred-currency: (var-get preferred-currency),
    is-high-stakes: (var-get is-high-stakes),
    players-allowed: players-allowed,
    players-joined: (var-get players-joined),
    lobby-status: (var-get lobby-status),
    match-timeout: (var-get match-timeout-interval),
    lobby-timeout: (var-get lobby-timeout-interval),
    host: (var-get lobby-host),
    launch-url: (unwrap-panic (get-launch-uri)),
    creator-info: creator-info
  })
)


;; Get match information
(define-read-only (get-match-info (match-id uint)) 
  (ok {
    id: game-id,
    lobby-name: (var-get lobby-name),
    lobby-description: (var-get lobby-description),
    award-owner: (nft-get-owner? tic-tac-toe-1 match-id),
    matches-played: (var-get last-match-id),
    buy-in: (var-get buy-in),
    buy-in-sbtc: (var-get buy-in-sbtc),
    is-high-stakes: (var-get is-high-stakes),
    players-allowed: players-allowed,
    players-joined: (var-get players-joined),
    status: (var-get lobby-status),
    match-timeout: (var-get match-timeout-interval),
    lobby-timeout: (var-get lobby-timeout-interval),
    host: (var-get lobby-host),
    launch-url: (unwrap-panic (get-launch-uri)),
    squares: (unwrap-panic (get-match-data match-id)),
    creator-info: creator-info
  })
)


;; Get fee information
(define-read-only (get-fee-info)
  (ok {
    creator-cut: (* (/ (var-get buy-in) u100) (var-get lobby-fee-of-100)),
    match-cut: (- (var-get buy-in) (* (/ (var-get buy-in) u100) (var-get lobby-fee-of-100))),
    creator-info: creator-info
  })
)

;; Get bomb status
(define-read-only (get-bomb-status)
    (ok {
        bombs-remaining: (var-get bombs-remaining),
        bomb-cost: (* (/ (var-get buy-in) u100) bomb-cost-percentage)
    })
)

;; Get match balance
(define-read-only (get-match-balance)
  (ok (stx-get-balance (as-contract tx-sender)))
)


;; Get match data
(define-read-only (get-match-data (match-id uint)) 
  (ok {
    square-0: (map-get? match-data { match-id: match-id, square: u0 }),
    square-1: (map-get? match-data { match-id: match-id, square: u1 }),
    square-2: (map-get? match-data { match-id: match-id, square: u2 }),
    square-3: (map-get? match-data { match-id: match-id, square: u3 }),
    square-4: (map-get? match-data { match-id: match-id, square: u4 }),
    square-5: (map-get? match-data { match-id: match-id, square: u5 }),
    square-6: (map-get? match-data { match-id: match-id, square: u6 }),
    square-7: (map-get? match-data { match-id: match-id, square: u7 }),
    square-8: (map-get? match-data { match-id: match-id, square: u8 })
  })
)


;; Get current game state
(define-read-only (get-current-game-state)
  (ok {
    active-player: (get player (unwrap-panic (map-get? players (var-get active-player-id)))),
    turn-number: (var-get turn-nonce),
    match-in-progress: (var-get match-in-progress),
    current-match-id: (+ (var-get last-match-id) u1),
    board: (unwrap-panic (get-match-data (+ (var-get last-match-id) u1)))
  })
)


;; Get match history
(define-read-only (get-match-history (match-id uint))
  (begin
    (asserts! (<= match-id (+ (var-get last-match-id) u1)) err-unknown-contract)
    (ok {
      winner: (get match-winner (map-get? match-winners { match-id: match-id })),
      board: (unwrap-panic (get-match-data match-id)),
      nft-owner: (nft-get-owner? tic-tac-toe-1 match-id),
      items-used: (var-get item-nonce)
    })
  )
)


;; Get match winner
(define-read-only (get-match-winner (match-id uint))
  (begin
    (asserts! (<= match-id (+ (var-get last-match-id) u1)) err-unknown-contract)
    (ok {
      match-winner: (get match-winner (map-get? match-winners { match-id: match-id }))
    })
  )
)


;; Get player count
(define-read-only (get-player-count)
  (ok (var-get players-joined))
)


;; Get creator cut
(define-read-only (get-creator-cut)
  (ok (* (/ (var-get buy-in) u100) (var-get lobby-fee-of-100)))
)


;; Get active player ID
(define-read-only (get-active-player-id) 
  (ok (var-get active-player-id))
)


;; Get player information
(define-read-only (get-player (player-id uint)) 
  (ok (get player (map-get? players player-id)))
)


;; ======================
;; SIP009 NFT FUNCTIONS
;; ======================

(define-read-only (get-last-token-id)
  (ok (var-get last-match-id)))

(define-read-only (get-owner (match-id uint))
  (ok (nft-get-owner? tic-tac-toe-1 match-id))
)

(define-read-only (get-token-uri (token-id uint))
  (ok (some 
    (concat
      (concat 
        (concat 
          (concat api-host "/api/contracts/")
          contract-deployer
        )
        (concat "/" contract-name)
      )
      (concat "/tokens/" (int-to-ascii token-id))
    )
  ))
)


;; ======================
;; PRIVATE FUNCTIONS
;; ======================

;; Check for winner
(define-private (is-winner) 
  (let ((match-id (+ (var-get last-match-id) u1)))
    (or 
      (and 
        (is-some (get player (map-get? match-data { match-id:  match-id, square: u0 }))) 
        (is-eq 
          (get player (map-get? match-data { match-id: match-id, square: u0 })) 
          (get player (map-get? match-data { match-id: match-id, square: u1 })) 
          (get player (map-get? match-data { match-id: match-id, square: u2 }))
        )
      )
      (and 
        (is-some (get player (map-get? match-data { match-id: match-id, square: u3 }))) 
        (is-eq 
          (get player (map-get? match-data { match-id: match-id, square: u3 })) 
          (get player (map-get? match-data { match-id: match-id, square: u4 })) 
          (get player (map-get? match-data { match-id: match-id, square: u5 }))
        )
      )
      (and 
        (is-some (get player (map-get? match-data { match-id: match-id, square: u6 }))) 
        (is-eq 
          (get player (map-get? match-data { match-id: match-id, square: u6 })) 
          (get player (map-get? match-data { match-id: match-id, square: u7 })) 
          (get player (map-get? match-data { match-id: match-id, square: u8 }))
        )
      )
      (and 
        (is-some (get player (map-get? match-data { match-id: match-id, square: u0 }))) 
        (is-eq 
          (get player (map-get? match-data { match-id: match-id, square: u0 })) 
          (get player (map-get? match-data { match-id: match-id, square: u3 })) 
          (get player (map-get? match-data { match-id: match-id, square: u6 }))
        )
      )
      (and 
        (is-some (get player (map-get? match-data { match-id: match-id, square: u1 }))) 
        (is-eq 
          (get player (map-get? match-data { match-id: match-id, square: u1 })) 
          (get player (map-get? match-data { match-id: match-id, square: u4 })) 
          (get player (map-get? match-data { match-id: match-id, square: u7 }))
        )
      )
      (and 
        (is-some (get player (map-get? match-data { match-id: match-id, square: u2 }))) 
        (is-eq 
          (get player (map-get? match-data { match-id: match-id, square: u2 })) 
          (get player (map-get? match-data { match-id: match-id, square: u5 })) 
          (get player (map-get? match-data { match-id: match-id, square: u8 }))
        )
      )
      (and 
        (is-some (get player (map-get? match-data { match-id: match-id, square: u0 }))) 
        (is-eq 
          (get player (map-get? match-data { match-id: match-id, square: u0 })) 
          (get player (map-get? match-data { match-id: match-id, square: u4 })) 
          (get player (map-get? match-data { match-id: match-id, square: u8 }))
        )
      )
      (and 
        (is-some (get player (map-get? match-data { match-id: match-id, square: u2 }))) 
        (is-eq 
          (get player (map-get? match-data { match-id: match-id, square: u2 })) 
          (get player (map-get? match-data { match-id: match-id, square: u4 })) 
          (get player (map-get? match-data { match-id: match-id, square: u6 }))
        )
      )
    )
  )
)


;; Get launch URI
(define-read-only (get-launch-uri)
  (ok (some
    (concat 
      (concat web-host "/games/")
      (int-to-ascii game-id)
    )
  ))
)


;; Mint NFT
(define-private (mint (winner principal) (match-id uint))
  (nft-mint? tic-tac-toe-1 match-id winner)
)


;; Reset match state
(define-private (reset-match)
  (begin
    (let ((next-id (+ u1 (var-get last-match-id))))
      (var-set last-match-id next-id)
    )
    (var-set active-player-id u1)
    (var-set lobby-status u0)
    (var-set match-in-progress false) 
    (var-set players-joined u0)
    (map-delete players u1)
    (map-delete players u2)
    (var-set turn-nonce u0)
    (var-set bombs-remaining max-bombs-per-match)
  )
)


;; Helper function for fee distribution
(define-private (distribute-single-fee (recipient principal) (amount uint) (is-sbtc bool))
  (if (not (is-eq tx-sender recipient))
    (if is-sbtc
      (contract-call? .sbtc-token transfer amount tx-sender recipient none)
      (stx-transfer? amount tx-sender recipient))
    (ok true))
)


;; Distribute STX fees
(define-private (distribute-fees (total-fees uint))
  (begin
    ;; Only one creator now, so no need to verify percentages
    (distribute-single-fee 
      (get address (get creator-1 creator-info))
      total-fees
      false)
  )
)


;; Distribute sBTC fees
(define-private (distribute-fees-sbtc (total-fees uint))
  (begin
    ;; Only one creator now, so no need to verify percentages
    (distribute-single-fee 
      (get address (get creator-1 creator-info))
      total-fees
      true)
  )
)


;; Add function to set preferred currency (restricted to lobby host)
(define-public (set-preferred-currency (currency uint))
  (begin
    (asserts! (is-eq tx-sender (var-get lobby-host)) err-unauthorized)
    (asserts! (or (is-eq currency currency-stx) (is-eq currency currency-sbtc)) err-invalid-currency)
    (var-set preferred-currency currency)
    (ok true)
  )
)


;; Get getter for preferred currency
(define-read-only (get-preferred-currency)
  (ok (var-get preferred-currency))
)

;; ======================
;; ADMIN FUNCTIONS
;; ======================

;; Update configurable contract parameters
(define-public (admin-update-config
    (new-buy-in (optional uint))
    (new-buy-in-sbtc (optional uint))
    (new-lobby-fee (optional uint))
    (new-match-timeout (optional uint))
    (new-lobby-timeout (optional uint))
    (new-host-domain (optional (string-ascii 255)))
    (new-high-stakes (optional bool))
    (new-lobby-name (optional (string-ascii 255)))
    (new-lobby-description (optional (string-ascii 255))))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-unauthorized)
    
    ;; Only update if new value provided (some)
    (if (is-some new-buy-in)
        (var-set buy-in (unwrap-panic new-buy-in))
        false)
    
    (if (is-some new-buy-in-sbtc)
        (var-set buy-in-sbtc (unwrap-panic new-buy-in-sbtc))
        false)
    
    (if (is-some new-lobby-fee)
        (var-set lobby-fee-of-100 (unwrap-panic new-lobby-fee))
        false)
    
    (if (is-some new-match-timeout)
        (var-set match-timeout-interval (unwrap-panic new-match-timeout))
        false)
    
    (if (is-some new-lobby-timeout)
        (var-set lobby-timeout-interval (unwrap-panic new-lobby-timeout))
        false)
    
    (if (is-some new-host-domain)
        (var-set host-domain (unwrap-panic new-host-domain))
        false)
    
    (if (is-some new-high-stakes)
        (var-set is-high-stakes (unwrap-panic new-high-stakes))
        false)

    (if (is-some new-lobby-name)
        (var-set lobby-name (unwrap-panic new-lobby-name))
        false)

    (if (is-some new-lobby-description)
        (var-set lobby-description (unwrap-panic new-lobby-description))
        false)

    (print { 
      eventName: "rt-admin-config-updated", 
      eventData: {
        contract-deployer: contract-deployer,
        contract-name: contract-name,
        game-id: game-id,
        lobby-name: (var-get lobby-name),
        lobby-description: (var-get lobby-description),
        buy-in: (var-get buy-in),
        buy-in-sbtc: (var-get buy-in-sbtc),
        lobby-fee: (var-get lobby-fee-of-100),
        match-timeout: (var-get match-timeout-interval),
        lobby-timeout: (var-get lobby-timeout-interval),
        host-domain: (var-get host-domain),
        is-high-stakes: (var-get is-high-stakes)
      }
    })

    (ok true)
  )
)

;; Force end current match as a draw
(define-public (admin-force-draw)
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-unauthorized)
    (asserts! (var-get match-in-progress) err-match-over)
    
    ;; Set match as draw
    (map-set match-winners { match-id: (+ (var-get last-match-id) u1) } {
      match-kitty: (stx-get-balance (as-contract tx-sender)),
      match-winner: none,
      award-owner: (as-contract tx-sender),
      currency-type: (var-get preferred-currency)
    })

    (print { 
      eventName: "rt-match-admin-draw", 
      eventData: {
        contract-deployer: contract-deployer,
        contract-name: contract-name,
        game-id: game-id,
        match-index: (+ (var-get last-match-id) u1)
      }
    })

    ;; Reset match state
    (reset-match)
    
    (ok true)
  )
)


;; ======================
;; INITIALIZATION
;; ======================

;; emit "Lobby Deployed"
(print { 
  eventName: "rt-lobby-deployed", 
  eventData: {
    contract-deployer: contract-deployer,
    contract-name: contract-name,
    game-id: game-id,
    lobby-name: (var-get lobby-name),
    lobby-description: (var-get lobby-description),
    lobby-fee-of-100: (var-get lobby-fee-of-100),
    match-index: (+ (var-get last-match-id) u1),
    matches-played: (var-get last-match-id),
    buy-in: (var-get buy-in),
    buy-in-sbtc: (var-get buy-in-sbtc),
    preferred-currency: (var-get preferred-currency),
    is-high-stakes: (var-get is-high-stakes),
    players-allowed: players-allowed,
    players-joined: (var-get players-joined),
    lobby-status: (var-get lobby-status),
    match-timeout: (var-get match-timeout-interval),
    lobby-timeout: (var-get lobby-timeout-interval),
    host: (var-get lobby-host),
    launch-url: (unwrap-panic (get-launch-uri)),
    creator-info: creator-info,
    max-bombs-per-match: max-bombs-per-match
  }
})


;; ======================
;; END OF FILE
;; ======================