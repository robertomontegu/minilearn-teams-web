# En apps/api/config/routes.rb, agrega la línea marcada con (+) dentro del namespace :auth:
#
# namespace :auth do
#   resources :sessions,      only: [:create]
#   resources :registrations, only: [:create]
# (+) post :google, to: "auth/google#create"   # <-- AGREGAR ESTA LÍNEA
# end
