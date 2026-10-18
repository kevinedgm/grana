// Todas las entradas publicadas de @grana/vue (salvo `testing`), solo para R1: ningún texto de aviso en producción.
import * as main from '@grana/vue'
import * as speech from '@grana/vue/speech'
import * as status from '@grana/vue/status'
import * as combobox from '@grana/vue/combobox'
import * as fileField from '@grana/vue/file-field'
import * as timeField from '@grana/vue/time-field'
import * as slider from '@grana/vue/slider'
import * as tag from '@grana/vue/tag'
import * as loadRegion from '@grana/vue/load-region'
import * as formFold from '@grana/vue/form-fold'
import * as cardGroup from '@grana/vue/card-group'
import * as pageHeader from '@grana/vue/page-header'
import * as fab from '@grana/vue/fab'

window.GranaAll = { main, speech, status, combobox, fileField, timeField, slider, tag, loadRegion, formFold, cardGroup, pageHeader, fab }
document.title = 'done'
