# Ruta: apps/api/app/controllers/api/v1/auth/google_controller.rb
# Agrega este archivo al repo minilearn-teams

module Api
  module V1
    module Auth
      class GoogleController < PublicController
        def create
          payload = Authentication::GoogleOauthService.new(
            id_token:       google_params.fetch(:id_token),
            workspace_name: google_params[:workspace_name]
          ).call

          render json: payload, status: :created
        rescue Authentication::GoogleOauthService::AuthError => e
          render json: { error: e.message }, status: :unprocessable_entity
        rescue ActionController::ParameterMissing => e
          render json: { error: e.message }, status: :bad_request
        end

        private

        def google_params
          params.require(:google).permit(:id_token, :workspace_name)
        end
      end
    end
  end
end
