# Ruta: apps/api/app/services/authentication/google_oauth_service.rb
# Agrega este archivo al repo minilearn-teams
#
# No requiere gems adicionales — usa Net::HTTP nativo de Ruby.
# Para producción con alto volumen, reemplaza tokeninfo por verificación
# local con JWT + Google JWKS (más rápido, sin llamada externa).

require "net/http"
require "json"
require "uri"

module Authentication
  class GoogleOauthService
    class AuthError < StandardError; end

    TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo".freeze

    def initialize(id_token:, workspace_name: nil)
      @id_token       = id_token
      @workspace_name = workspace_name
    end

    def call
      claims = verify_token!

      user = User.find_by(email: claims["email"])

      if user
        # Usuario existente — devolver su token de sesión
        {
          token:          user.auth_token,
          workspace_slug: user.workspace.slug,
          user: {
            id:    user.id,
            name:  user.name,
            email: user.email
          }
        }
      else
        # Usuario nuevo — crear workspace + owner
        ws_name = @workspace_name.presence || derive_workspace_name(claims["email"])

        RegisterWorkspaceService.new(
          workspace_name: ws_name,
          name:           claims["name"].presence || claims["email"].split("@").first.capitalize,
          email:          claims["email"],
          password:       SecureRandom.hex(24)  # contraseña aleatoria; el usuario nunca la usará
        ).call
      end
    end

    private

    # Verifica el ID token contra el endpoint tokeninfo de Google.
    # Retorna el payload decodificado o lanza AuthError.
    def verify_token!
      uri      = URI("#{TOKENINFO_URL}?id_token=#{URI.encode_www_form_component(@id_token)}")
      response = Net::HTTP.get_response(uri)

      unless response.is_a?(Net::HTTPSuccess)
        raise AuthError, "No se pudo contactar a Google para verificar el token."
      end

      claims = JSON.parse(response.body)

      raise AuthError, claims["error_description"] if claims["error"]
      raise AuthError, "El token no está destinado a esta aplicación." \
        unless claims["aud"] == ENV.fetch("GOOGLE_CLIENT_ID")
      raise AuthError, "El email de Google no está verificado." \
        unless claims["email_verified"].to_s == "true"

      claims
    rescue JSON::ParserError
      raise AuthError, "Respuesta inválida de Google."
    rescue Errno::ECONNREFUSED, SocketError => e
      raise AuthError, "Error de red al verificar con Google: #{e.message}"
    end

    def derive_workspace_name(email)
      domain = email.split("@").last
      domain.split(".").first.capitalize
    end
  end
end
