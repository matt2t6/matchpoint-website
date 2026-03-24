export const getAdjustedDeliveryStyle = (delivery_style, fatigue) => {
  if (fatigue > 0.65 && delivery_style !== 'calm') {
    return 'reassuring';
  }
  return delivery_style;
};
